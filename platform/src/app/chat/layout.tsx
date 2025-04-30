import { HStack } from "@chakra-ui/react";
import { Provider } from "./provider";
import { ControlPanel } from "./_components/ControlPanel";
import { Effects } from "./_components/Effects";
import ChatGuard from "./_components/ChatGuard";
import { LayoutLayout } from "@/components/ui/layout";
import { Header } from "./_components/Header";

export default function Layout({
    children,
}: React.PropsWithChildren) {
    return (
        <ChatGuard>
            <Provider>
                <LayoutLayout>
                    <Effects />
                    <Header />
                    <HStack gap={"6"} w={"full"} h={"full"}>
                        <ControlPanel flex={"1"} />
                        {children}
                    </HStack>
                </LayoutLayout>
            </Provider>
        </ChatGuard>
    )
}