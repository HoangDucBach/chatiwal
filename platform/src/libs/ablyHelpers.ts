import { MessageType } from "@/types";

export class AblyChannelManager {
    static readonly CHANNELS = {
        GROUP_CHAT: (groupId: string) => `chat:group:${groupId}`,
        DIRECT_CHAT: (addressA: string, addressB: string) => {
            const [a, b] = [addressA, addressB].sort();
            return `chat:direct:${a}:${b}`;
        },
        GROUP_PRESENCE: (groupId: string) => `presence:group:${groupId}`,
        INBOX: (address: string) => `inbox:${address}`,
    } as const;

    static readonly EVENTS = {
        // Notification
        NOTIFICATION_RECEIVED: 'notification-received',

        // Snapshot
        MESSAGES_SNAPSHOT_MINTED: 'messages-snapshot-minted',
        MESSAGES_SNAPSHOT_CAP_MINTED: 'messages-snapshot-cap-minted',

        // Message
        SUPER_MESSAGE_MINTED: 'super-message-minted',
        MESSAGE_SEND: 'message-send',
        MESSAGE_READ: 'message-read',

        // Fee
        FEES_WITHDRAWN: 'fees-withdrawn',

        // Group
        GROUP_MINTED: 'group-minted',
        GROUP_CAP_MINTED: 'group-cap-minted',
        GROUP_MEMBER_ADDED: 'group-member-added',
        GROUP_MEMBER_REMOVED: 'group-member-removed'
    } as const;

    static getChannel(type: "GROUP_CHAT", groupId: string): string;
    static getChannel(type: "DIRECT_CHAT", addressA: string, addressB: string): string;
    static getChannel(type: "GROUP_PRESENCE", groupId: string): string;
    static getChannel(type: "INBOX", address: string): string;
    static getChannel(type: keyof typeof AblyChannelManager.CHANNELS, ...params: string[]): string {
        const definition = AblyChannelManager.CHANNELS[type];
        if (typeof definition === "function") {
            return (definition as (...args: string[]) => string)(...params);
        }
        return definition as string;
    }

    static getEvent(type: keyof typeof AblyChannelManager.EVENTS): string {
        return AblyChannelManager.EVENTS[type];
    }

    static parseChannel(channel: string): {
        type: "GROUP_CHAT" | "DIRECT_CHAT" | "GROUP_PRESENCE";
        ids: string[];
    } {
        if (channel.startsWith('chat:group:')) {
            const groupId = channel.split(':')[2];
            return { type: "GROUP_CHAT", ids: [groupId] };
        } else if (channel.startsWith('chat:direct:')) {
            const [, , addressA, addressB] = channel.split(':');
            return { type: "DIRECT_CHAT", ids: [addressA, addressB] };
        } else if (channel.startsWith('presence:group:')) {
            const groupId = channel.split(':')[2];
            return { type: "GROUP_PRESENCE", ids: [groupId] };
        }

        throw new Error(`Unknown channel format: ${channel}`);
    }

    static getChannelType(channel: string): MessageType {
        if (channel.startsWith('chat:group:')) {
            return MessageType.GROUP;
        } else if (channel.startsWith('chat:direct:')) {
            return MessageType.DIRECT;
        }

        throw new Error(`Unknown channel type: ${channel}`);
    }
}