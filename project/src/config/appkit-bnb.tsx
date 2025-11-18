import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bscTestnet } from "viem/chains";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Project ID for Reown Appkit
const projectId = "809a4f016b4ec4f147e587aef5f24af9";

// Create metadata for the application
const metadata = {
  name: "KAIDO",
  description: "KAIDO - AI-Powered Prediction Markets on BNB Smart Chain",
  url: "https://kaidobnb.xyz",
  icons: ["https://kaidobnb.xyz/kaido.png"],
};

// Create Wagmi adapter for BNB Smart Chain Testnet
const wagmiAdapter = new WagmiAdapter({
  networks: [bscTestnet],
  projectId,
});

// Create Appkit instance with BNB Testnet configuration
const appkitInstance = createAppKit({
  adapters: [wagmiAdapter],
  networks: [bscTestnet],
  metadata,
  projectId,
  features: {
    email: true, // Enable email login
    socials: ['google', 'x', 'discord', 'farcaster', 'github', 'apple', 'facebook'],
    emailShowWallets: true, // Show wallet options alongside email/social
    analytics: true,
    send: true,
    receive: true,
    swaps: true,
    onramp: true,
    history: true,
    connectMethodsOrder: ["wallet", "email", "social"],
    persistence: {
      enabled: true,
      storage: 'localStorage'
    },
    signatureCache: true,
    connection: {
      autoConnect: true,
      reconnect: true,
      persistentSessions: true,
      sessionExpiry: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
      reconnectOnRefresh: true
    }
  },
  sessionPersistence: {
    enabled: true,
    persistSignatures: true,
    expiry: 14 * 24 * 60 * 60 * 1000 // 14 days in milliseconds
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#F3BA2F', // BNB yellow accent color
    '--w3m-color-mix': '#1e293b', // Slate-800 background
    '--w3m-color-mix-strength': 40,
    '--w3m-z-index': 10000,
  },
  allWallets: 'SHOW',
  debug: true,
  enableWalletConnect: true,
  enableNetworkSwitch: true,
  enableOnramp: true,
});

// Create query client for React Query
const queryClient = new QueryClient();

// Make appkit instance available globally for debugging
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.appkit = appkitInstance;
  // @ts-ignore
  window.wagmiAdapter = wagmiAdapter;
}

export { wagmiAdapter, appkitInstance, queryClient };
