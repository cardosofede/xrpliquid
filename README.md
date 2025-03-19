# XRPLiquid

XRPL Liquidity Platform with simplified UI and functionality.

## App Structure

The application has been streamlined to include only three primary sections:

### Dashboard
- Shows aggregated information including:
  - Number of users
  - Number of wallets 
  - Number of transactions
  - Total volume traded in RLUSD (with historical chart)
  - Asset trading statistics table

### Leaderboard
- Displays user performance metrics in a table format:
  - User IDs
  - Transaction counts
  - Trading volume
  - Performance score

### Miners
- Shows detailed information for a specific user:
  - General statistics (transactions, volume, score)
  - Active open orders
  - Order history chart and table

## Technologies

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Shadcn UI Components

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.