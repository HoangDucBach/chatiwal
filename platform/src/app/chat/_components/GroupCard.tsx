"use client"

import { useWalrusClient } from "@/hooks/useWalrusClient";
import { TGroup } from "@/types";
import { HStack, StackProps, Text, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { MetadataGroupSchema, type MetadataGroup } from "@/libs/schema";
import { formatAddress } from "@mysten/sui/utils";

interface Props extends StackProps {
    group: TGroup;
    isSelected?: boolean;
}
export function GroupCard({ isSelected, ...props }: Props) {
    const { group, } = props;
    const router = useRouter();
    const { read } = useWalrusClient();

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
                bg: "bg.300",
            }}
            bg={isSelected ? "bg.300" : "transparent"}
            backdropBlur={"2xl"}
            rounded={"2xl"}
            cursor={"pointer"}
            onClick={handleClick}
            {...props}
        >
            <VStack gap={"0"} alignItems={"start"}>
                <Text color={"fg"} fontWeight={"medium"}>{group?.metadata?.name || formatAddress(group.id)}</Text>
                <Text color={"fg.contrast"} fontSize={"sm"}>{group.members.size || 0} members</Text>
            </VStack>
        </HStack>
    )
}