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
                <LayoutLayout bg={"bg.100"}>
                    <HStack w={"full"} h={"full"} gap={0}>
                        <ControlPanel p={"4"} flex={"1"} />
                        <Center py={"4"} w={"full"} h={"full"}>
                            <HStack w={"full"} h={"full"} p={"4"} bg={"bg.50"} rounded={"4xl"} shadow={"custom.md"}>
                                {children}
                            </HStack>
                        </Center>
                    </HStack>
                </LayoutLayout>
            </Provider>
        </ChatGuard>
    )
}