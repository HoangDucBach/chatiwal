import { PageLayout } from "@/components/ui/layout";
import HeroSection from "./_components/HeroSection";
import { Effects } from "./_components/Effects";

export default function Home() {
  return (
    <PageLayout>
      <Effects />
      <HeroSection />
    </PageLayout>
  );
}