import { create } from "zustand";

interface WalletStatusState {
    isConnected: boolean;
    setConnected: (v: boolean) => void;
}

export const useWalletStatus = create<WalletStatusState>((set) => ({
    isConnected: false,
    setConnected: (v: boolean) => set({ isConnected: v }),
}));