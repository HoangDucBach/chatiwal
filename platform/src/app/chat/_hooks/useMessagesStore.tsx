import { create } from 'zustand'
import { persist } from "zustand/middleware";
import { TMessage } from '@/types'
import { decode, encode } from '@msgpack/msgpack';
import { fromByteArray, toByteArray } from "base64-js";

type MessageStore = {
    messagesByChannel: Record<string, TMessage[]>
    addMessage: (channelName: string, message: TMessage) => void
    clearMessages: (channelName: string) => void
    getMessages: (channelName: string) => TMessage[]
}

export const useMessageStore = create<MessageStore>()(
    persist(
        (set, get) => ({
            messagesByChannel: {},

            addMessage: (channelName, message) => {
                set((state) => {
                    const existing = state.messagesByChannel[channelName] || [];
                    return {
                        messagesByChannel: {
                            ...state.messagesByChannel,
                            [channelName]: [...existing, message],
                        },
                    };
                });
            },

            clearMessages: (channelName) => {
                set((state) => {
                    const { [channelName]: _, ...rest } = state.messagesByChannel;
                    return { messagesByChannel: rest };
                });
            },

            getMessages: (channelName) => {
                return get().messagesByChannel[channelName] || [];
            },
        }),
        {
            name: "channel-messages",
            partialize: (state) => ({ messagesByChannel: state.messagesByChannel }),
            storage: {
                getItem: (name) => {
                    const base64 = sessionStorage.getItem(name);
                    if (!base64) return null;
                    const uint8arr = toByteArray(base64);
                    return decode(uint8arr) as any
                },
                setItem: (name, value) => {
                    const uint8arr = encode(value);
                    const base64 = fromByteArray(uint8arr);
                    sessionStorage.setItem(name, base64);
                },
                removeItem: (name) => {
                    sessionStorage.removeItem(name);
                },
            },
        }
    )
);