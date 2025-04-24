"use client";

import { ChannelProvider } from "ably/react";

interface ProviderProps extends React.PropsWithChildren {
    channelName: string;
}
export default function Provider(
    { children, channelName }: ProviderProps
) {

    return (
        <ChannelProvider channelName={channelName}>
            {children}
        </ChannelProvider>
    );
}