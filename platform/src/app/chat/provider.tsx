"use client"

import { AblyProvider } from "ably/react";
import { DashboardGuard } from "./_components/DashboardGuard";
import { useCurrentAccount } from "@mysten/dapp-kit";
import * as Ably from "ably";
import { ABLY_API_KEY } from "@/utils/constants";

export function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const currentAccount = useCurrentAccount();

    if (!currentAccount) return null;

    const ablyClient = new Ably.Realtime({
        clientId: currentAccount?.address,
        key: ABLY_API_KEY
    });

    return (
        <DashboardGuard>
            <AblyProvider client={ablyClient}>
                {children}
            </AblyProvider>
        </DashboardGuard>
    );
}