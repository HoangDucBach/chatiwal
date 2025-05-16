import { Chat } from "@/app/chat/_components/Chat";
import Provider from "./provider";
import { DirectMessageProvider } from "@/app/chat/_hooks/useDirectMessageId";
import { ChatInfo } from "@/app/chat/_components/ChatInfo";

export default async function Page({
    params,
}: Readonly<{
    params: Promise<{
        address: string;
    }>;
}>) {
    const { address } = await params;

    return (
        <Provider id={address}>
            <DirectMessageProvider id={address}>
                <Chat channelType="DIRECT_CHAT" />
                <ChatInfo channelType="DIRECT_CHAT" />
            </DirectMessageProvider>
        </Provider>
    );
}