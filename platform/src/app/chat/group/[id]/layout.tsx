import { HStack } from "@chakra-ui/react";
import { ControlPanel } from "../../_components/ControlPanel";
import { GroupControlPanel } from "../../_components/GroupControlPanel";
import { Effects } from "../../_components/Effects";
import { PageLayout } from "@/components/ui/layout";

export default function Layout({
    children,
}: React.PropsWithChildren) {
    return (
        <PageLayout>
            <Effects />
            {children}
        </PageLayout>
    )
}