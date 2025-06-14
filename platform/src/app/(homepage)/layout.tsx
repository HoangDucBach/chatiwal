import { Footer } from "./_components/Footer";
import { Header } from "./_components/Header";
import { LayoutLayout } from "@/components/ui/layout";
import SpaceSection from "./_components/SpaceSection";
import { SmoothScrollLayout } from "./_components/SmoothScrollLayout";

export default function Layout({
    children,
}: React.PropsWithChildren) {
    return (
        <LayoutLayout align={"center"} overflow={"auto"} scrollBehavior={"smooth"}>
            <Header />
            {children}
        </LayoutLayout>
    )
}