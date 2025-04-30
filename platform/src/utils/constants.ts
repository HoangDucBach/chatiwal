export const ABLY_API_KEY = process.env.ABLY_API_KEY || "u6OJJg.Aa9Evw:JPyuYwNLLS5Y7YIGh5fHXvjYP5gcVAegAkAhmCD3QXs";

export const NETWORK = "testnet" as const;

export const SUI_EXPLORER_URL = NETWORK === "testnet" ? "https://suiscan.xyz/testnet" : "https://suiscan.io/mainnet";