import { HStack } from "@chakra-ui/react";
import { ControlPanel } from "./_components/ControlPanel";
import { GroupControlPanel } from "./_components/GroupControlPanel";
import { Provider } from "./provider";
import { Effects } from "./_components/Effects";
import { PageLayout } from "@/components/ui/layout";

export default function Layout({
    children,
}: React.PropsWithChildren) {
    return (
        <Provider>
            <PageLayout>
                <Effects />
                <HStack w={"full"} h={"full"}>
                    <ControlPanel flex={"1 0"} />
                    {children}
                    <GroupControlPanel flex={"1 0"} />
                </HStack>
            </PageLayout>
        </Provider>
    )
}