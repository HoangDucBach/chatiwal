import { create } from 'zustand';

interface DirectMessagesState {
    directChatAddresses: string[];
    addDirectChat: (address: string) => void;
    removeDirectChat: (address: string) => void;
    hasDirectChat: (address: string) => boolean;
    clearDirectChats: () => void;
}

export const useDirectMessages = create<DirectMessagesState>((set, get) => ({
    directChatAddresses: [],

    addDirectChat: (address: string) => {
        const current = get().directChatAddresses;
        if (!current.includes(address)) {
            set({ directChatAddresses: [...current, address] });
        }
    },

    removeDirectChat: (address: string) => {
        set({
            directChatAddresses: get().directChatAddresses.filter(
                (a) => a !== address
            ),
        });
    },

    hasDirectChat: (address: string) => {
        return get().directChatAddresses.includes(address);
    },

    clearDirectChats: () => set({ directChatAddresses: [] }),
}));