import { create } from "zustand";

interface SubscribedChannelsState {
    subscribedChannels: string[];
    hasSubscribed: (channel: string) => boolean;
    addChannel: (channel: string) => void;
}

export const useSubscribedChannelsStore = create<SubscribedChannelsState>((set, get) => ({
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
}));