import { Header } from "./_components/Header";
import { LayoutLayout } from "@/components/ui/layout";

export default function Layout({
    children,
}: React.PropsWithChildren) {
    return (
        <LayoutLayout align={"center"}>
            <Header />
            {children}
        </LayoutLayout>
    )
}