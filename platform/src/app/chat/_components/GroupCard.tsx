"use client"

import { Button } from "@/components/ui/button"
import { TGroup } from "@/types";
import { HStack, StackProps, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"

interface Props extends StackProps {
    group: TGroup;
}
export function GroupCard(props: Props) {
    const { group } = props;

    const [isSelected, setIsSelected] = useState(true)
    if (!group) return null;

    return (
        <HStack
            w={"full"}
            p={"3"}
            bg={isSelected ? "primary" : "bg.200"}
            transition="all 0.2s ease-in-out"
            _hover={{
                translateY: "4",
            }}
            backdropBlur={"2xl"}
            rounded={"2xl"}
            cursor={"pointer"}
            {...props}
        >
            <VStack gap={"0"} alignItems={"start"}>
                <Text color={"primary.fg"} fontWeight={"medium"}>{group.name || "Cyan Group | Beta"}</Text>
                <Text color={"primary.contrast"} fontSize={"sm"}>{group.members.size || 0} members</Text>
            </VStack>
        </HStack>
    )
}