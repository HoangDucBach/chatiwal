"use client";

import { AllFeaturesEnabled } from '@ably/chat';
import { ChatRoomProvider, useRoom } from '@ably/chat/react';


interface GroupProps {
    roomId: string;
}
export const Group = () => {
    const { attach, roomId } = useRoom();
    
    return (
        <ChatRoomProvider id={roomId} options={AllFeaturesEnabled}>
            <div>
                <button onClick={attach}>Attach Me!</button>
            </div>
        </ChatRoomProvider>
    );
};

