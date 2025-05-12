import { Chat } from "../../../_components/Chat";
import Provider from "./provider";
import { GroupProvider } from "../../../_hooks/useGroup";

export default async function Page({
    params,
}: Readonly<{
    params: Promise<{
        id: string;
    }>;
}>) {
    const { id } = await params;


    return (
        <Provider id={id}>
            <GroupProvider id={id}>
                <Chat channelType="GROUP_CHAT" flex={"4"} />
            </GroupProvider>
        </Provider>
    );
}