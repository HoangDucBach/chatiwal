import { SessionKey } from "@mysten/seal";
import { create } from "zustand";

interface SessionKeyStore {
    groupKeys: Record<string, SessionKey>;
    messageKeys: Record<string, SessionKey>;

    setGroupKey: (groupId: string, key: SessionKey) => void;
    getGroupKey: (groupId: string) => SessionKey | undefined;

    setMessageKey: (messageId: string, key: SessionKey) => void;
    getMessageKey: (messageId: string) => SessionKey | undefined;

    clearAll: () => void;
}

export const useSessionKeys = create<SessionKeyStore>((set, get) => ({
    groupKeys: {},
    messageKeys: {},

    setGroupKey: (groupId, key) =>
        set((state) => ({
            groupKeys: {
                ...state.groupKeys,
                [groupId]: key,
            },
        })),

    getGroupKey: (groupId) => get().groupKeys[groupId],

    setMessageKey: (messageId, key) =>
        set((state) => ({
            messageKeys: {
                ...state.messageKeys,
                [messageId]: key,
            },
        })),

    getMessageKey: (messageId) => get().messageKeys[messageId],

    clearAll: () => set({ groupKeys: {}, messageKeys: {} }),
}));