"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as UIProvider } from "@/components/ui/provider";
import suiConfig from "@/utils/sui.config";
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';

const queryClient = new QueryClient();

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
                        {children}
                    </UIProvider>
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}