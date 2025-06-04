"use client"

import { AblyProvider, useAbly, useConnectionStateListener } from "ably/react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import * as Ably from "ably";
import { decode } from "@msgpack/msgpack";

import { ABLY_API_KEY } from "@/utils/constants";
import { useMessageStore } from "./_hooks/useMessagesStore";
import { useEffect } from "react";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { useDirectMessages } from "./_hooks/useDirectMessages";
import { TMessage } from "@/types";
import { useSubscribedChannelsStore } from "./_hooks/useSubsribedChannelStore";
import { useMembershipGroups } from "./_hooks/useMembershipGroups";
import { toaster } from "@/components/ui/toaster";

export function InboxChannelProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { addMessage, getMessages } = useMessageStore();
    const { addChannel, hasSubscribed } = useSubscribedChannelsStore();
    const { addDirectChat, hasDirectChat } = useDirectMessages()
    const currentAccount = useCurrentAccount();
    const ably = useAbly();

    useConnectionStateListener("connected", () => {
        if (!currentAccount) return;

        const inboxChannelName = AblyChannelManager.getChannel("INBOX", currentAccount.address);
        const inboxChannel = ably.channels.get(inboxChannelName);
        inboxChannel.presence.enterClient(currentAccount?.address);
    });

    useConnectionStateListener("disconnected", () => {
        if (!currentAccount) return;

        const inboxChannelName = AblyChannelManager.getChannel("INBOX", currentAccount.address);
        const inboxChannel = ably.channels.get(inboxChannelName);
        inboxChannel.presence.leaveClient(currentAccount?.address);
    });

    useEffect(() => {
        if (!currentAccount) return;

        const inboxChannelName = AblyChannelManager.getChannel("INBOX", currentAccount.address);
        const inboxChannel = ably.channels.get(inboxChannelName);

        if (!hasSubscribed(inboxChannelName)) {
            addChannel(inboxChannelName);

            inboxChannel.subscribe(AblyChannelManager.EVENTS.NOTIFICATION_RECEIVED, (message) => {
                const { clientId } = message;

                if (!clientId) return;
                const directChannelName = AblyChannelManager.getChannel("DIRECT_CHAT", currentAccount.address, clientId);
                if (!hasDirectChat(directChannelName)) {
                    addDirectChat(clientId);
                }
                if (!hasSubscribed(directChannelName)) {
                    addChannel(directChannelName);
                    ably.channels.get(directChannelName).subscribe(AblyChannelManager.EVENTS.MESSAGE_SEND, (message) => {
                        try {
                            const messageData = message.data;
                            addMessage(directChannelName, decode(messageData) as TMessage);
                        } catch (error) {
                            console.log(error)
                        }
                    }
                    );
                }
            });

        }
        return () => {
            inboxChannel.unsubscribe();
        };
    }, []);
    return (
        <>
            {children}
        </>
    );
}

export function GroupChannelsProvider({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { addChannel, hasSubscribed } = useSubscribedChannelsStore();
    const { addMessage } = useMessageStore();
    const currentAccount = useCurrentAccount();
    const { membershipIds } = useMembershipGroups();
    const ably = useAbly();

    useEffect(() => {
        if (!currentAccount || membershipIds.length === 0) return;

        const subscriptions: { [channelName: string]: (message: any) => void } = {};
        const attachedChannels: string[] = [];

        membershipIds.forEach(async (groupId) => {
            const groupChannelName = AblyChannelManager.getChannel("GROUP_CHAT", groupId);
            if (hasSubscribed(groupChannelName)) return;

            addChannel(groupChannelName);
            const groupChannel = ably.channels.get(groupChannelName);

            try {
                await groupChannel.attach();
                attachedChannels.push(groupChannelName);
            } catch (error) {
                console.error(`[Ably] Failed to attach channel ${groupChannelName}:`, error);
                return;
            }

            const handler = (message: any) => {
                try {
                    console.log(`[Ably] Received message on ${groupChannelName}:`, message);
                    const messageData = message.data;
                    addMessage(groupChannelName, decode(messageData) as TMessage);
                } catch (error) {
                    console.error(`[Ably] Failed to decode message on ${groupChannelName}:`, error);
                }
            };

            subscriptions[groupChannelName] = handler;
            groupChannel.subscribe(AblyChannelManager.EVENTS.MESSAGE_SEND, handler);
        });

        return () => {
            Object.entries(subscriptions).forEach(([channelName, handler]) => {
                const channel = ably.channels.get(channelName);
                channel.unsubscribe(AblyChannelManager.EVENTS.MESSAGE_SEND, handler);
            });

            Promise.allSettled(
                attachedChannels.map((channelName) =>
                    ably.channels.get(channelName).detach().catch((err) => {
                        console.warn(`[Ably] Detach failed for ${channelName}:`, err);
                    })
                )
            );
        };
    }, [currentAccount?.address, JSON.stringify(membershipIds)]);

    return <>{children}</>;
}
export function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const currentAccount = useCurrentAccount();


    const ablyClient = new Ably.Realtime({
        clientId: currentAccount?.address,
        closeOnUnload: true,
        autoConnect: typeof window !== "undefined",
        key: ABLY_API_KEY,
        useBinaryProtocol: true,
    });

    useEffect(() => {
        queueMicrotask(() => {
            toaster.dismiss("redirecting-to-chat");
        });
    }, [])

    return (
        <AblyProvider client={ablyClient}>
            <InboxChannelProvider>
                <GroupChannelsProvider>
                    {children}
                </GroupChannelsProvider>
            </InboxChannelProvider>
        </AblyProvider>
    );
}