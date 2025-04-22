import { PageLayout } from "@/components/ui/layout";
import { HStack } from "@chakra-ui/react";
import { ControlPanel } from "./_components/ControlPanel";
import { Chat } from "./_components/Chat";
import { GroupControlPanel } from "./_components/GroupControlPanel";
import { Effects } from "./_components/Effects";
import { NotConnectedDialog } from "./_components/NotConnectedDialog";

export default function Page() {
    return (
        <PageLayout>
            <Effects />
            <HStack w={"full"} h={"full"}>
                <ControlPanel flex={"1 0"} />
                <Chat flex={"3 0"} />
                <GroupControlPanel flex={"1 0"} />
            </HStack>
        </PageLayout>
    );
}