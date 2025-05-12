import { Chat } from "@/app/chat/_components/Chat";
import Provider from "./provider";
import { DirectMessageProvider } from "@/app/chat/_hooks/useDirectMessageId";

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
                <Chat channelType="DIRECT_CHAT" flex={"4"} />
            </DirectMessageProvider>
        </Provider>
    );
}