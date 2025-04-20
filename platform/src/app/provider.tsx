"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { ChatClient } from '@ably/chat';
import { ChatClientProvider } from '@ably/chat/react';


import { Provider as UIProvider } from "@/components/ui/provider";
import suiConfig from "@/utils/sui.config";
import utils from "@/utils"

const queryClient = new QueryClient();
const chatClient = new ChatClient(utils.ably, {});

export default function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider network={suiConfig.defaultNetwork} networks={suiConfig.networks}>
                <WalletProvider>
                    <UIProvider>
                        <ChatClientProvider client={chatClient}>
                            {children}
                        </ChatClientProvider>
                    </UIProvider>
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}