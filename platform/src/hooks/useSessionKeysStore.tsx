import { SessionKey } from "@mysten/seal";
import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';

interface SessionKeyStore {
    sessionKeys: Map<string, SessionKey>;
    setSessionKey: (id: string, key: SessionKey) => void;
    getSessionKey: (id: string) => SessionKey | undefined;
    clearAll: () => void;
}

function replacer(key: string, value: any): any {
    if (value instanceof Map) {
        return {
            __type: 'Map',
            data: Array.from(value.entries()),
        };
    }
    return value;
}

function reviver(key: string, value: any): any {
    if (typeof value === 'object' && value !== null && value.__type === 'Map' && Array.isArray(value.data)) {
        return new Map(value.data);
    }
    return value;
}


export const useSessionKeys = create<SessionKeyStore>()(
    persist(
        (set, get) => ({
            sessionKeys: new Map<string, SessionKey>(),

            setSessionKey: (id, key) =>
                set((state) => {
                    const newsessionKeys = new Map(state.sessionKeys);
                    newsessionKeys.set(id, key);
                    return { sessionKeys: newsessionKeys };
                }),

            getSessionKey: (id) => get().sessionKeys.get(id),

            clearAll: () => set({ sessionKeys: new Map() }),
        }),
        {
            name: 'session-key-storage',
            storage: createJSONStorage(() => sessionStorage, {
                replacer,
                reviver,
            }),
            partialize: (state) => ({
                sessionKeys: state.sessionKeys,
            }),
        }
    )
);