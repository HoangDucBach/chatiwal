import { PageLayout } from "@/components/ui/layout";
import HeroSection from "./_components/HeroSection";
import { Effects } from "./_components/Effects";
import { VStack } from "@chakra-ui/react";
import { SupportedBrands } from "./_components/SupportedBrands";

export default function Home() {
  return (
    <PageLayout
      h={"full"}
      w={"full"}
      mx={"auto"}
      flexDirection={"column"}
      display={"flex"}
      alignItems={"center"}
      overflow={"auto"}
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