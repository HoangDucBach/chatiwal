"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";

import { ChannelProvider } from "ably/react";

interface ProviderProps extends React.PropsWithChildren {
    channelName: string;
}
export default function Provider(
    { children, channelName }: ProviderProps
) {
    const currentAccount = useCurrentAccount();

    if (!currentAccount) return null;

    return (
        <ChannelProvider channelName={channelName}>
            {children}
        </ChannelProvider>
    );
}