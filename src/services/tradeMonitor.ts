import WebSocket from 'ws';
import { ENV } from '../config/env';
import { getUserActivityModel, getUserPositionModel } from '../models/userHistory';
import fetchData from '../utils/fetchData';
import Logger from '../utils/logger';

/* -------------------------------------------------------------------------- */
/*                               Configuration                                */
/* -------------------------------------------------------------------------- */

const {
  USER_ADDRESSES,
  TOO_OLD_TIMESTAMP,
  RTDS_URL,
  PROXY_WALLET,
  TOP_POSITIONS_USER_COUNT,
  TOP_POSITIONS_TRADER_COUNT,
} = ENV;

if (!USER_ADDRESSES?.length) {
  throw new Error('USER_ADDRESSES is not defined or empty');
}

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type UserModel = {
  address: string;
  UserActivity: ReturnType<typeof getUserActivityModel>;
  UserPosition: ReturnType<typeof getUserPositionModel>;
};

export type TradeActivity = {
  transactionHash: string;
  timestamp: number;
  conditionId: string;
  proxyWallet: string;
  size: number;
  price: number;
  asset: string;
  side: string;
  outcomeIndex: number;
  title?: string;
  slug?: string;
  icon?: string;
  eventSlug?: string;
  outcome?: string;
  name?: string;
  pseudonym?: string;
  bio?: string;
  profileImage?: string;
  profileImageOptimized?: string;
};

/* -------------------------------------------------------------------------- */
/*                               Models Cache                                  */
/* -------------------------------------------------------------------------- */

export const userModels: UserModel[] = USER_ADDRESSES.map(address => ({
  address,
  UserActivity: getUserActivityModel(address),
  UserPosition: getUserPositionModel(address),
}));

/* -------------------------------------------------------------------------- */
/*                               Initialization                                */
/* -------------------------------------------------------------------------- */

export const initTradeMonitorState = async (): Promise<void> => {
  const counts: number[] = [];

  for (const { UserActivity } of userModels) {
    counts.push(await UserActivity.countDocuments());
  }

  Logger.clearLine();
  Logger.dbConnection(USER_ADDRESSES, counts);

  await logOwnPositions();
  await logTrackedTraderPositions();
};

const logOwnPositions = async (): Promise<void> => {
  try {
    const myPositions = await fetchData(
      `https://data-api.polymarket.com/positions?user=${PROXY_WALLET}`,
    );

    const getMyBalance = (await import('../utils/getMyBalance')).default;
    const balance = await getMyBalance(PROXY_WALLET);

    if (!Array.isArray(myPositions)) return;

    let totalValue = 0;
    let initialValue = 0;
    let weightedPnl = 0;

    for (const p of myPositions) {
      const v = p.currentValue ?? 0;
      const i = p.initialValue ?? 0;
      const pnl = p.percentPnl ?? 0;

      totalValue += v;
      initialValue += i;
      weightedPnl += v * pnl;
    }

    const overallPnl = totalValue ? weightedPnl / totalValue : 0;

    Logger.myPositions(
      PROXY_WALLET,
      myPositions.length,
      [...myPositions]
        .sort((a, b) => (b.percentPnl ?? 0) - (a.percentPnl ?? 0))
        .slice(0, TOP_POSITIONS_USER_COUNT),
      overallPnl,
      totalValue,
      initialValue,
      balance,
    );
  } catch (err) {
    Logger.error(`Own position log failed: ${err}`);
  }
};

const logTrackedTraderPositions = async (): Promise<void> => {
  const counts: number[] = [];
  const details: any[][] = [];
  const pnls: number[] = [];

  for (const { UserPosition } of userModels) {
    const positions = await UserPosition.find().exec();
    counts.push(positions.length);

    let totalValue = 0;
    let weightedPnl = 0;

    for (const p of positions) {
      const v = p.currentValue ?? 0;
      const pnl = p.percentPnl ?? 0;
      totalValue += v;
      weightedPnl += v * pnl;
    }

    pnls.push(totalValue ? weightedPnl / totalValue : 0);

    details.push(
      [...positions]
        .sort((a, b) => (b.percentPnl ?? 0) - (a.percentPnl ?? 0))
        .slice(0, TOP_POSITIONS_TRADER_COUNT)
        .map(p => p.toObject()),
    );
  }

  Logger.tradersPositions(USER_ADDRESSES, counts, details, pnls);
};

/* -------------------------------------------------------------------------- */
/*                           Trade Persistence API                              */
/* -------------------------------------------------------------------------- */

export const processTradeActivity = async (
  activity: TradeActivity,
  address: string,
): Promise<void> => {
  const model = userModels.find(m => m.address === address);
  if (!model) return;

  const { UserActivity } = model;

  const ts = activity.timestamp > 1e12
    ? activity.timestamp
    : activity.timestamp * 1000;

  if ((Date.now() - ts) / 36e5 > TOO_OLD_TIMESTAMP) return;

  if (await UserActivity.exists({ transactionHash: activity.transactionHash })) return;

  await new UserActivity({
    ...activity,
    type: 'TRADE',
    usdcSize: activity.price * activity.size,
    bot: false,
    botExcutedTime: 0,
  }).save();

  Logger.info(`New trade | ${address.slice(0, 6)}…${address.slice(-4)}`);
};

/* -------------------------------------------------------------------------- */
/*                         Position Sync (Manual Call)                          */
/* -------------------------------------------------------------------------- */

export const syncPositionsOnce = async (): Promise<void> => {
  for (const { address, UserPosition } of userModels) {
    try {
      const positions = await fetchData(
        `https://data-api.polymarket.com/positions?user=${address}`,
      );

      if (!Array.isArray(positions)) continue;

      for (const p of positions) {
        await UserPosition.findOneAndUpdate(
          { asset: p.asset, conditionId: p.conditionId },
          p,
          { upsert: true },
        );
      }
    } catch (err) {
      Logger.error(`Position sync failed (${address}): ${err}`);
    }
  }
};

/* -------------------------------------------------------------------------- */
/*                       RTDS Connection (Stateless)                            */
/* -------------------------------------------------------------------------- */

export const createRTDSConnection = (): WebSocket => {
  if (!RTDS_URL) throw new Error('RTDS_URL not configured');

  const socket = new WebSocket(RTDS_URL);

  socket.on('open', () => {
    Logger.success('RTDS connected');
    socket.send(
      JSON.stringify({
        type: 'SUBSCRIBE',
        addresses: USER_ADDRESSES,
      }),
    );
  });

  socket.on('message', async raw => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg?.activity && msg?.address) {
        await processTradeActivity(msg.activity, msg.address);
      }
    } catch (err) {
      Logger.error(`RTDS message error: ${err}`);
    }
  });

  return socket;
};
