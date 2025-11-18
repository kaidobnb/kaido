# KAIDO - Loss-Edge AI Agent Enhanced Prediction Market

KAIDO is the first Loss-Edge AI Agent enhanced consumer-layer prediction market built for the next generation of on-chain participation on BNB Chain — where users can create, join, and earn from prediction contracts autonomously powered by KAIDO LLM.

## Features

- Hybrid on-chain/off-chain prediction system on BNB Smart Chain (BSC)
- Loss-Edge Pool: Losers receive compensation (2% of all entry fees)
- AI-powered prediction creation and analysis
- Smart contract-based trustless resolution
- Wallet connection using Reown Appkit for BNB Chain
- User profile management with username and email
- MongoDB integration for user data storage
- Oracle service for automated prediction resolution

## Project Structure

- `project/` - Frontend React application
- `backend/` - Backend Node.js/Express API

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd project
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Configure environment variables:

Create a `.env` file in the `backend` directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kaido
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=development
```

4. Start the development servers:

```bash
# Start both frontend and backend
npm run dev

# Or start them separately
npm run start:frontend
npm run start:backend
```

## Backend API Endpoints

- `POST /api/users/connect` - Log wallet connection
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

## Frontend

The frontend is built with:

- React
- TypeScript
- Reown Appkit for BNB Chain wallet integration
- Wagmi + Viem for smart contract interactions
- Tailwind CSS for styling

## Wallet Integration

We use Reown Appkit for wallet integration, which provides:

- Wallet connection
- Transaction signing
- Network selection
- User authentication

## User Profile Setup

After connecting a wallet, users are prompted to set up their profile with:

- Username
- Email

This information is stored in the MongoDB database and associated with the wallet address.

## License

ISC
