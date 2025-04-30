import { PageLayout } from "@/components/ui/layout";
import HeroSection from "./_components/HeroSection";
import { Effects } from "./_components/Effects";
import { Center, VStack } from "@chakra-ui/react";

export default function Home() {
  return (
    <PageLayout>
      <Center>
        <VStack
          maxW={["full", "full", "lg", "2xl"]}
          h={"full"}
          w={"full"}
          align={"center"}
        >
          <Effects />
          <HeroSection />
        </VStack>
      </Center>
    </PageLayout>
  );
}