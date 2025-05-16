"use client";

import { ChannelNameProvider } from "@/app/chat/_hooks/useChannelName";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { ChannelProvider } from "ably/react";

interface ProviderProps extends React.PropsWithChildren {
    id: string;
}
export default function Provider(
    { children, id }: ProviderProps
) {
    const channelName = AblyChannelManager.getChannel("GROUP_CHAT", id);

    return (
        <ChannelProvider channelName={channelName}>
            <ChannelNameProvider channelName={channelName}>
                {children}
            </ChannelNameProvider>
        </ChannelProvider>
    );
}