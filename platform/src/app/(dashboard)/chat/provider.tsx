"use client";

import * as Ably from "ably";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { toaster } from "@/components/ui/toaster"
import utils from "@/utils";
import { ABLY_API_KEY } from "@/utils/constants";
import { useEffect } from "react";
import { AblyProvider } from "ably/react";


interface ProviderProps extends React.PropsWithChildren {
}
export default function Provider(
    { children }: ProviderProps
) {
    const currentAccount = useCurrentAccount();

    useEffect(() => {
        if (!currentAccount) {
            queueMicrotask(() => {
                toaster.error({
                    title: "Not connected",
                    description: "Please connect your wallet!",
                });
            });
        }
    }, [currentAccount]);

    if (!currentAccount) return null;

    const ablyClient = new Ably.Realtime({
        clientId: currentAccount?.address,
        key: ABLY_API_KEY
    });

    return (
        <AblyProvider client={ablyClient}>
            <div>
                {children}
            </div>
        </AblyProvider>
    );
}