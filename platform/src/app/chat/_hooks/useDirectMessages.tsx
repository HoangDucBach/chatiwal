import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DirectMessagesState {
    directChatAddresses: string[];
    addDirectChat: (address: string) => void;
    removeDirectChat: (address: string) => void;
    hasDirectChat: (address: string) => boolean;
    clearDirectChats: () => void;
}

export const useDirectMessages = create<DirectMessagesState>()(
    persist(
        (set, get) => ({
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
        }),
        {
            name: 'direct-messages-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);