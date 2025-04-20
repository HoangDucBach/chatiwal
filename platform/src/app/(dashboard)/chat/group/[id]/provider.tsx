"use client";

import { AllFeaturesEnabled } from "@ably/chat";
import { ChatRoomProvider } from "@ably/chat/react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { toaster } from "@/components/ui/toaster"
import { useEffect } from "react";

interface ProviderProps extends React.PropsWithChildren {
    roomId: string;
}
export default function Provider(
    { children, roomId }: ProviderProps
) {
    const currentAccount = useCurrentAccount();

    if (!currentAccount) return null;

    return (
        <ChatRoomProvider id={roomId} options={AllFeaturesEnabled}>
            {children}
        </ChatRoomProvider>
    );
}