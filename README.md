# Nilai Dashboard

A developer dashboard for managing API keys, credits, and usage statistics for nilAI.

## Getting Started

### Prerequisites

- Node.js
- pnpm

### Installation

```bash
pnpm install
```

### Running

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Credit Service
NILAUTH_CREDIT_URL=http://localhost:3030/v1/
NILAUTH_CREDIT_TOKEN=your_token_here

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Usage Statistics
NILAI_INSTANCE_FOR_USAGE_STATS=https://credit.nilai.sandbox.nilogy.xyz/

# Privy (authentication)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Optional: Base URL for Stripe redirects (defaults to request origin)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Tech Stack

- **Next.js** - React framework
- **Privy** - Authentication
- **Stripe** - Payment processing for credit top-ups
- **nilAuth Credit Service** - Credit and credential management
- **nilAI** - Usage statistics

## Features

- User authentication via Privy
- API key management (UUID-based keys)
- DID management for NUCs and delegation flow
- Credit balance management
- Stripe payment integration for adding credits
- Usage statistics tracking
