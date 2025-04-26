"use client"

import { TGroup } from "@/types";
import { HStack, StackProps, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation";

interface Props extends StackProps {
    group: TGroup;
    isSelected?: boolean;
}
export function GroupCard({ isSelected, ...props }: Props) {
    const { group, } = props;
    const router = useRouter();

    const handleClick = () => {
        if (!group) return;
        router.push(`/chat/group/${group.id}`);
    }

    if (!group) return null;

    return (
        <HStack
            w={"full"}
            p={"3"}
            transition="all 0.2s ease-in-out"
            _hover={{
                translateY: "4",
                bg: "bg.300",
            }}
            bg={isSelected ? "bg.300" : "bg.200"}
            backdropBlur={"2xl"}
            rounded={"2xl"}
            cursor={"pointer"}
            onClick={handleClick}
            {...props}
        >
            <VStack gap={"0"} alignItems={"start"}>
                <Text color={"fg"} fontWeight={"medium"}>{group.name || "Cyan Group | Beta"}</Text>
                <Text color={"fg.contrast"} fontSize={"sm"}>{group.members.size || 0} members</Text>
            </VStack>
        </HStack>
    )
}