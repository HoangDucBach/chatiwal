import { Chat } from "../../_components/Chat";
import Provider from "./provider";
import { GroupProvider } from "../../_hooks/useGroupId";
import { HStack, Text } from "@chakra-ui/react";
import { ControlPanel } from "../../_components/ControlPanel";
import { GroupControlPanel } from "../../_components/GroupControlPanel";

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
                <Chat flex={"3 0"} />
                <GroupControlPanel flex={"1 0"} />
            </GroupProvider>
        </Provider>
    );
}