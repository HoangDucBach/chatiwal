import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SubscribedChannelsState {
    subscribedChannels: string[];
    hasSubscribed: (channel: string) => boolean;
    addChannel: (channel: string) => void;
}

export const useSubscribedChannelsStore = create<SubscribedChannelsState>()(
    persist(
        (set, get) => ({
            subscribedChannels: [],

            hasSubscribed: (channel: string) => {
                return get().subscribedChannels.includes(channel);
            },

            addChannel: (channel: string) => {
                set((state) => {
                    if (!state.subscribedChannels.includes(channel)) {
                        return {
                            subscribedChannels: [...state.subscribedChannels, channel]
                        };
                    }
                    return state;
                });
            },
        }),
        {
            name: 'subscribed-channels',
            storage: {
                getItem: (name) => {
                    const item = sessionStorage.getItem(name);
                    return item ? JSON.parse(item) : null;
                },
                setItem: (name, value) => {
                    sessionStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: (name) => {
                    sessionStorage.removeItem(name);
                },
            }
        }
    )
);