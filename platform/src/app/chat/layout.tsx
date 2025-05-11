import { HStack } from "@chakra-ui/react";
import { Provider } from "./provider";
import { ControlPanel } from "./_components/ControlPanel";
import { Effects } from "./_components/Effects";
import ChatGuard from "./_components/ChatGuard";
import { LayoutLayout } from "@/components/ui/layout";
import { Header } from "./_components/Header";
import { LeftBar } from "@/components/global/bars";

export default function Layout({
    children,
}: React.PropsWithChildren) {
    return (
        <ChatGuard>
            <Provider>
                <LayoutLayout>
                    <HStack w={"full"} h={"full"}>
                        <LeftBar />
                        <ControlPanel flex={"1"} />
                        {children}
                    </HStack>
                </LayoutLayout>
            </Provider>
        </ChatGuard>
    )
}