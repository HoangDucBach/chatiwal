import { Center, HStack } from "@chakra-ui/react";
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
                <LayoutLayout bg={"bg"}>
                    <HStack py={"4"} w={"full"} h={"full"} gap={0}>
                        <LeftBar />
                        <ControlPanel flex={1} />
                        {children}
                    </HStack>
                </LayoutLayout>
            </Provider>
        </ChatGuard>
    )
}