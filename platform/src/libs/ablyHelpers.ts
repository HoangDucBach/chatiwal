export class AblyChannelManager {
    static readonly CHANNELS = {
        GROUP_CHAT: (groupId: string) => `group::${groupId}`,
        GROUP_PRESENCE: (groupId: string) => `presence::group::${groupId}`
    } as const;

    static readonly EVENTS = {
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

    static getChannel(type: keyof typeof AblyChannelManager.CHANNELS | string, ...params: string[]): string {
        const definition = AblyChannelManager.CHANNELS[type as keyof typeof AblyChannelManager.CHANNELS];
        if (typeof definition === 'function') {
            return (definition as (...args: string[]) => string)(...params);
        }
        return definition as string;
    }

    static getEvent(type: keyof typeof AblyChannelManager.EVENTS): string {
        return AblyChannelManager.EVENTS[type];
    }
}

export type ChannelType = keyof typeof AblyChannelManager.CHANNELS;
export type EventType = keyof typeof AblyChannelManager.EVENTS;