"use client"

import { Header as HeaderComponent } from '@/components/global/bars'
import { siteConfig } from '@/config/site'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbRoot, For } from '@chakra-ui/react'

interface Props { }
export function Header({ ...prop }: Props) {
    return (
        <HeaderComponent flex={"1 1"}>
            <BreadcrumbRoot>
                <BreadcrumbList>
                    <For each={siteConfig.navLinks}>
                        {(link) =>
                            <BreadcrumbItem key={link.href}>
                                <BreadcrumbLink href={link.href}>
                                    {link.name}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        }
                    </For>
                </BreadcrumbList>
            </BreadcrumbRoot>
        </HeaderComponent>
    )
}