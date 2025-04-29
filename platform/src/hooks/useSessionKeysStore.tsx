import { SessionKey } from "@mysten/seal";
import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';

interface SessionKeyStore {
    groupKeys: Map<string, SessionKey>;
    messageKeys: Map<string, SessionKey>;
    setGroupKey: (groupId: string, key: SessionKey) => void;
    getGroupKey: (groupId: string) => SessionKey | undefined;
    setMessageKey: (messageId: string, key: SessionKey) => void;
    getMessageKey: (messageId: string) => SessionKey | undefined;
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
            groupKeys: new Map<string, SessionKey>(),
            messageKeys: new Map<string, SessionKey>(),

            setGroupKey: (groupId, key) =>
                set((state) => {
                    const newGroupKeys = new Map(state.groupKeys);
                    newGroupKeys.set(groupId, key);
                    return { groupKeys: newGroupKeys };
                }),

            getGroupKey: (groupId) => get().groupKeys.get(groupId),

            setMessageKey: (messageId, key) =>
                set((state) => {
                    const newMessageKeys = new Map(state.messageKeys);
                    newMessageKeys.set(messageId, key);
                    return { messageKeys: newMessageKeys };
                }),

            getMessageKey: (messageId) => get().messageKeys.get(messageId),

            clearAll: () => set({ groupKeys: new Map(), messageKeys: new Map() }),
        }),
        {
            name: 'session-key-storage',
            storage: createJSONStorage(() => sessionStorage, {
                replacer,
                reviver,
            }),
            partialize: (state) => ({
                groupKeys: state.groupKeys,
                messageKeys: state.messageKeys,
            }),
        }
    )
);