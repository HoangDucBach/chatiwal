"use client";

import { ChannelNameProvider } from "@/app/chat/_hooks/useChannelName";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { ChannelProvider } from "ably/react";

interface ProviderProps extends React.PropsWithChildren {
    id: string;
}
export default function Provider(
    { children, id }: ProviderProps
) {
    const currentAccount = useCurrentAccount();

    if (!currentAccount) {
        return null;
    }

    const channelName = AblyChannelManager.getChannel("DIRECT_CHAT", currentAccount.address, id);

    return (
        <ChannelProvider channelName={channelName}>
            <ChannelNameProvider channelName={channelName}>
                {children}
            </ChannelNameProvider>
        </ChannelProvider>
    );
}