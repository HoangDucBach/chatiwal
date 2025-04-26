import { Chat } from "../../_components/Chat";
import Provider from "./provider";
import { GroupProvider } from "../../_hooks/useGroupId";

export default async function Page({
    params,
}: Readonly<{
    params: Promise<{
        id: string;
    }>;
}>) {
    const { id } = await params;

    return (
        <Provider channelName={id}>
            <GroupProvider id={id}>
                <Chat flex={"4"} />
            </GroupProvider>
        </Provider>
    );
}