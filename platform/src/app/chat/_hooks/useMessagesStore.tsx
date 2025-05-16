import { create } from 'zustand'
import { persist } from "zustand/middleware";
import { TMessage } from '@/types'

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
                            [channelName]: [...existing, message]
                        }
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
            name: 'channel-messages',
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