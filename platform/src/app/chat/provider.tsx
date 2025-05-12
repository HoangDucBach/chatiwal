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

        membershipIds.forEach((groupId) => {
            const groupChannelName = AblyChannelManager.getChannel("GROUP_CHAT", groupId);
            if (!hasSubscribed(groupChannelName)) {
                addChannel(groupChannelName);

                const handler = (message: any) => {
                    try {
                        const messageData = message.data;
                        addMessage(groupChannelName, decode(messageData) as TMessage);
                    } catch (error) {
                        console.error(error);
                    }
                };

                subscriptions[groupChannelName] = handler;
                ably.channels.get(groupChannelName).subscribe(AblyChannelManager.EVENTS.MESSAGE_SEND, handler);
            }
        });

        return () => {
            Object.entries(subscriptions).forEach(([channelName, handler]) => {
                ably.channels.get(channelName).unsubscribe(AblyChannelManager.EVENTS.MESSAGE_SEND, handler);
            });
            Object.keys(subscriptions).forEach((channelName) => {
                ably.channels.get(channelName).detach();
            });
        };
    }, [currentAccount?.address, JSON.stringify(membershipIds)]);

    return (
        <>
            {children}
        </>
    );
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