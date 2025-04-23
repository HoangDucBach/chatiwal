import { PageLayout } from "@/components/ui/layout";
import { Chat } from "../../_components/Chat";
import { AblyPubSub } from "../_components/Message";
import Provider from "./provider";

export default async function Page({
    params,
}: Readonly<{
    params: Promise<{
        id: string;
    }>;
}>) {
    const { id } = await params;

    return (
        <Provider roomId={id}>
            <Chat channelName={id} flex={"3 0"}/>
        </Provider>
    );
}