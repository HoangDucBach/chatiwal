import { PageLayout } from "@/components/ui/layout";
import HeroSection from "./_components/HeroSection";
import { Effects } from "./_components/Effects";
import { VStack } from "@chakra-ui/react";

export default function Home() {
  return (
    <PageLayout>
      <VStack h={"full"} maxW={["full", undefined, "50%"]}>
        <Effects />
        <HeroSection />
      </VStack>
    </PageLayout>
  );
}