import { HStack } from "@chakra-ui/react";
import { Provider } from "./provider";
import { ControlPanel } from "./_components/ControlPanel";
import { Effects } from "./_components/Effects";
import ChatGuard from "./_components/ChatGuard";

export default function Layout({
    children,
}: React.PropsWithChildren) {
    return (
        <ChatGuard>
            <Provider>
                <Effects />
                <HStack w={"full"} h={"full"} overflow={"auto"}>
                    <ControlPanel flex={"1 0"} />
                    {children}
                </HStack>
            </Provider>
        </ChatGuard>
    )
}