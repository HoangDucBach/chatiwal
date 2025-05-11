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
            {siteConfig.navLinks.map((link) => (
                <ChakraLink asChild key={link.href} variant={"plain"} color={"fg.800"} _hover={{ color: "fg", transition: "color ease-in-out 0.5s" }}>
                    <Link href={link.href}>
                        {link.name}
                    </Link>
                </ChakraLink>
            ))}
        </HStack>
    )
}

const Tools = () => {
    return (
        <HStack align={"right"} justify={"right"} flex={"1 0"}>
        </HStack>
    )
}