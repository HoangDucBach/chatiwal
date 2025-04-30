export const ABLY_API_KEY = process.env.NEXT_PUBLIC_ABLY_API_KEY as string;

export const NETWORK = "testnet" as const;

export const SUI_EXPLORER_URL = NETWORK === "testnet" ? "https://suiscan.xyz/testnet" : "https://suiscan.io/mainnet";