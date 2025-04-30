import { SessionKey } from "@mysten/seal";
import { create } from "zustand";

interface SessionKeyStore {
    sessionKeys: Map<string, SessionKey>;
    setSessionKey: (id: string, key: SessionKey) => void;
    getSessionKey: (id: string) => SessionKey | null;
    clearAll: () => void;
}

export const useSessionKeys = create<SessionKeyStore>((set, get) => ({
    sessionKeys: new Map<string, SessionKey>(),

    setSessionKey: (id, key) =>
        set((state) => {
            const newsessionKeys = new Map(state.sessionKeys);
            newsessionKeys.set(id, key);
            return { sessionKeys: newsessionKeys };
        }),

    getSessionKey: (id) => {
        const value = get().sessionKeys.get(id);
        if (value instanceof SessionKey) {
            return value;
        }
        return null;
    },

    clearAll: () => set({ sessionKeys: new Map() }),
}));