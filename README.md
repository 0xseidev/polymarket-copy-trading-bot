# Polymarket Copy Trading Bot

> Automated copy trading bot for Polymarket that mirrors trades from top performers with intelligent position sizing and real-time execution.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

## Overview

The Polymarket Copy Trading Bot automatically replicates trades from successful Polymarket traders to your wallet. It monitors trader activity 24/7, calculates proportional position sizes based on your capital, and executes matching orders in real-time.

### How It Works
<img width="995" height="691" alt="screenshot" src="https://github.com/user-attachments/assets/79715c7a-de2c-4033-81e6-b2288963ec9b" />

1. **Select Traders** - Choose top performers from [Polymarket leaderboard](https://polymarket.com/leaderboard) or [Predictfolio](https://predictfolio.com)
2. **Monitor Activity** - Bot continuously watches for new positions opened by selected traders using Polymarket Data API
3. **Calculate Size** - Automatically scales trades based on your balance vs. trader's balance
4. **Execute Orders** - Places matching orders on Polymarket using your wallet
5. **Track Performance** - Maintains complete trade history in MongoDB

## Quick Start

### Prerequisites

- Node.js v18+
- MongoDB database ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) free tier works)
- Polygon wallet with USDC and POL/MATIC for gas
- RPC endpoint ([Infura](https://infura.io) or [Alchemy](https://www.alchemy.com) free tier)

### Installation

```bash
# Clone repository
git clone https://github.com/0xRustElite1111/polymarket-copy-trading-bot.git
cd polymarket-copy-trading-bot

# Install dependencies
npm install

# Run interactive setup wizard
npm run setup

# Build and start
npm run build
npm run health-check  # Verify configuration
npm start             # Start trading
```

**📖 For detailed setup instructions, see [Getting Started Guide](./docs/GETTING_STARTED.md)**

## Features

- **Multi-Trader Support** - Track and copy trades from multiple traders simultaneously
- **Smart Position Sizing** - Automatically adjusts trade sizes based on your capital
- **Tiered Multipliers** - Apply different multipliers based on trade size
- **Position Tracking** - Accurately tracks purchases and sells even after balance changes
- **Trade Aggregation** - Combines multiple small trades into larger executable orders
- **Real-time Execution** - Monitors trades every second and executes instantly
- **MongoDB Integration** - Persistent storage of all trades and positions
- **Price Protection** - Built-in slippage checks to avoid unfavorable fills

### Monitoring Method

The bot currently uses the **Polymarket Data API** to monitor trader activity and detect new positions. The monitoring system polls trader positions at configurable intervals (default: 1 second) to ensure timely trade detection and execution.

**🚀 Version 2 Available:** An advanced version with **RTDS (Real-Time Data Stream)** monitoring is now available as a private repository. Version 2 features the fastest trade detection method with near-instantaneous trade replication, lower latency, and reduced API load. Copy trading works excellently in the advanced version.

I've also developed a monitoring bot for Polymarket built with **Rust** - it's a useful tool for tracking and analyzing market activity.
<img width="680" height="313" alt="image (19)" src="https://github.com/user-attachments/assets/d868f9f2-a1dd-4bfe-a76e-d8cbdfbd8497" />

## Configuration

### Essential Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `USER_ADDRESSES` | Traders to copy (comma-separated) | `'0xABC..., 0xDEF...'` |
| `PROXY_WALLET` | Your Polygon wallet address | `'0x123...'` |
| `PRIVATE_KEY` | Wallet private key (no 0x prefix) | `'abc123...'` |
| `MONGO_URI` | MongoDB connection string | `'mongodb+srv://...'` |
| `RPC_URL` | Polygon RPC endpoint | `'https://polygon...'` |
| `TRADE_MULTIPLIER` | Position size multiplier (default: 1.0) | `2.0` |
| `FETCH_INTERVAL` | Check interval in seconds (default: 1) | `1` |

### Finding Traders

1. Visit [Polymarket Leaderboard](https://polymarket.com/leaderboard)
2. Look for traders with positive P&L, win rate >55%, and active trading history
3. Verify detailed stats on [Predictfolio](https://predictfolio.com)
4. Add wallet addresses to `USER_ADDRESSES`

**📖 For complete configuration guide, see [Quick Start](./docs/QUICK_START.md)**

## Docker Deployment

Deploy with Docker Compose for a production-ready setup:

```bash
# Configure and start
cp .env.example .env
docker-compose up -d

# View logs
docker-compose logs -f polymarket
```

**📖 [Complete Docker Guide →](./docs/DOCKER.md)**

## Safety & Risk Management

⚠️ **Important Disclaimers:**

- **Use at your own risk** - This bot executes real trades with real money
- **Start small** - Test with minimal funds before scaling up
- **Diversify** - Don't copy just one trader; track multiple strategies
- **Monitor regularly** - Check bot logs daily to ensure proper execution
- **No guarantees** - Past performance doesn't guarantee future results

### Best Practices

1. Use a dedicated wallet separate from your main funds
2. Only allocate capital you can afford to lose
3. Research traders thoroughly before copying
4. Set up monitoring and alerts
5. Know how to stop the bot quickly (Ctrl+C)

## Documentation

### Getting Started
- **[🚀 Getting Started Guide](./docs/GETTING_STARTED.md)** - Complete beginner's guide
- **[⚡ Quick Start](./docs/QUICK_START.md)** - Fast setup for experienced users

### Advanced Guides
- **[🐳 Docker Deployment](./docs/DOCKER.md)** - Container deployment
- **[👥 Multi-Trader Guide](./docs/MULTI_TRADER_GUIDE.md)** - Copy multiple traders
- **[📍 Position Tracking](./docs/POSITION_TRACKING.md)** - How tracking works
- **[💰 Funding Guide](./docs/FUNDING_GUIDE.md)** - Wallet funding instructions

### Testing & Analysis
- **[🧪 Simulation Guide](./docs/SIMULATION_GUIDE.md)** - Backtest strategies
- **[🔬 Simulation Runner](./docs/SIMULATION_RUNNER_GUIDE.md)** - Advanced backtesting

## Troubleshooting

### Common Issues

**Missing environment variables** → Run `npm run setup` to create `.env` file

**MongoDB connection failed** → Verify `MONGO_URI`, whitelist IP in MongoDB Atlas

**Bot not detecting trades** → Verify trader addresses and check recent activity

**Insufficient balance** → Add USDC to wallet and ensure POL/MATIC for gas fees

**Run health check:** `npm run health-check`

**📖 For detailed troubleshooting, see [Quick Start Guide](./docs/QUICK_START.md)**

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC License - See [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on [Polymarket CLOB Client](https://github.com/Polymarket/clob-client)
- Uses [Predictfolio](https://predictfolio.com) for trader analytics
- Powered by Polygon network

---

**Disclaimer:** This software is for educational purposes only. Trading involves risk of loss. The developers are not responsible for any financial losses incurred while using this bot.

**Support:** For questions or issues, contact via Telegram: [@u_known1111](https://t.me/u_known1111)
