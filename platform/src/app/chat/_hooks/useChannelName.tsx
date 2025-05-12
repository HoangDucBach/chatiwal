"use client";

import { createContext, useContext, ReactNode } from "react";

const ChannelNameContext = createContext<{ channelName: string } | null>(null);

export const ChannelNameProvider = ({ channelName, children }: { channelName: string; children: ReactNode }) => {
    return (
        <ChannelNameContext.Provider value={{ channelName: channelName }}>
            {children}
        </ChannelNameContext.Provider>
    );
};

export const useChannelName = () => {
    const context = useContext(ChannelNameContext);
    if (!context) {
        throw new Error("useGroup must be used within a GroupProvider");
    }
    return context;
};