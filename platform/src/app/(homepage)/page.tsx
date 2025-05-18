import { PageLayout } from "@/components/ui/layout";
import HeroSection from "./_components/HeroSection";
import { Effects } from "./_components/Effects";
import { Center, VStack } from "@chakra-ui/react";
import { Posters } from "./_components/Posters";
import IntroSection from "./_components/IntroSection";

export default function Home() {
  return (
    <PageLayout
      h={"fit"}
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
      >
        <Effects />
        <HeroSection />
        <Posters />
      </VStack>
    </PageLayout>
  );
}