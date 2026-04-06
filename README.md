# GigPay

A decentralized gig economy payment platform built on Algorand. GigPay handles worker registration, task verification, and escrow-based USDC payments for gig workers — all on-chain.

## Architecture

This is an AlgoKit monorepo with four projects:

| Project | Description |
|---------|-------------|
| [gigpay-contracts](projects/gigpay-contracts/README.md) | Algorand Python (PuyaPy) smart contracts |
| [gigpay-frontend](projects/gigpay-frontend/README.md) | React + Vite frontend with wallet integration |
| [gigpay-agent](projects/gigpay-agent/) | TypeScript agent service for automated operations |
| [gigpay-oracle](projects/gigpay-oracle/) | Hono-based oracle service with x402 payment support |

### Smart Contracts

- **WorkerRegistry** — Register gig workers, track ratings and earnings
- **EscrowPool** — USDC custody and release based on confirmed deliveries
- **DeliveryManager** (TaskVerification) — Track deliveries, confirm completion, calculate rating-based payouts

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) (for AlgoKit LocalNet)
- [AlgoKit CLI](https://github.com/algorandfoundation/algokit-cli#install)
- Node.js >= 20
- Python 3.12+ with Poetry

### Setup

```bash
# 1. Clone and bootstrap
git clone <repo-url> && cd gigpay
algokit project bootstrap all

# 2. Generate localnet env file
cd projects/gigpay-contracts
algokit generate env-file -a target_network localnet
cd ../..

# 3. Start localnet and build
algokit localnet start
algokit project run build
```

### Development

```bash
# Smart contracts
algokit project run build       # Compile contracts, generate clients
algokit project run test        # Run integration tests
algokit project deploy localnet # Deploy to localnet

# Frontend
cd projects/gigpay-frontend
npm run dev                     # Start dev server

# Oracle
cd projects/gigpay-oracle
npm run dev                     # Start oracle service

# Agent
cd projects/gigpay-agent
npm run dev                     # Start agent service
```

After building contracts, TypeScript application clients are auto-generated and linked to the frontend via `algokit project link --all`.

## Tech Stack

- **Smart Contracts**: Algorand Python (PuyaPy), compiled to TEAL via Puya compiler
- **Frontend**: React 18, Vite, Tailwind CSS, daisyUI, use-wallet
- **Oracle**: Hono, x402-avm (HTTP-native payments)
- **Agent**: TypeScript, AlgoKit Utils, algosdk
- **Tooling**: AlgoKit CLI, Poetry, ESLint, Prettier, Playwright

## CI/CD

GitHub Actions workflows in [`.github/workflows`](./.github/workflows) handle CI checks, testing, and deployment. On pushes to `main`:

- Smart contracts are deployed to TestNet via [AlgoNode](https://algonode.io)
- Frontend is deployed to Vercel

Deployments use `algokit deploy`. See [AlgoKit deploy docs](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/features/deploy.md) for configuration.
