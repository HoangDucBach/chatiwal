import { PageLayout } from "@/components/ui/layout";
import HeroSection from "./_components/HeroSection";
import { Effects } from "./_components/Effects";
import { VStack } from "@chakra-ui/react";
import { SupportedBrands } from "./_components/SupportedBrands";
import SpaceSection from "./_components/SpaceSection";

export default function Home() {
  return (
    <PageLayout
      h={"fit"}
      w={"full"}
      flexDirection={"column"}
      display={"flex"}
      alignItems={"center"}
    >
      <VStack
        w={"full"}
        maxW={["full", "full", "4xl", "6xl"]}
        h={"full"}
      >
        <Effects />
        <HeroSection />
      </VStack>
    </PageLayout>
  );
}