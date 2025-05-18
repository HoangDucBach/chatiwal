import { Header as HeaderComponent } from "@/components/global/bars"
import { siteConfig } from "@/config/site"
import { HStack, Link as ChakraLink } from "@chakra-ui/react"
import Link from "next/link"

export function Header() {
    return (
        <HeaderComponent>
            <NavLinks />
            <Tools />
        </HeaderComponent>
    )
}

const NavLinks = () => {
    return (
        <HStack flexGrow={"1"} align={"center"} justify={"center"} flex={"1 0"}>
            {
                Object.entries(siteConfig.navLinks).map(([key, value]) => (
                    <ChakraLink
                        as={Link}
                        href={value.href}
                        key={key}
                        fontSize={"md"}
                        color={"fg.700"}
                        _hover={{
                            textDecoration: "none",
                            color: "fg.900",
                        }}
                    >
                        {value.name}
                    </ChakraLink>
                ))
            }
        </HStack>
    )
}

const Tools = () => {
    return (
        <HStack align={"right"} justify={"right"} flex={"1 0"}>
        </HStack>
    )
}