import { Center } from "@chakra-ui/react";

interface HeroSectionProps extends React.HTMLAttributes<HTMLElement> {
}
export default function SpaceSection(props: HeroSectionProps) {
    return (
        <Center
            w={"full"}
            h={"full"}
            minH={"50svh"}
        />
    )
}