"use client";

import { AllFeaturesEnabled } from "@ably/chat";
import { ChatRoomProvider } from "@ably/chat/react";

interface ProviderProps extends React.PropsWithChildren {
    roomId: string;
}
export default function Provider(
    { children, roomId }: ProviderProps
): React.JSX.Element {
    return (
        <ChatRoomProvider id={roomId} options={AllFeaturesEnabled}>
            <div>
                {children}
            </div>
        </ChatRoomProvider>
    );
}