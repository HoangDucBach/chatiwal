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
            <AblyPubSub channelName={id} />
        </Provider>
    );
}