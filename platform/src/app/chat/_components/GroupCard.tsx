"use client"

import { TGroup } from "@/types";
import { HStack, StackProps, Text } from "@chakra-ui/react"
import { useRouter } from "next/navigation";
import { formatAddress } from "@mysten/sui/utils";

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
                bg: "bg.300",
                color: "fg",
            }}
            bg={isSelected ? "bg.300" : "transparent"}
            backdropBlur={"2xl"}
            rounded={"2xl"}
            cursor={"pointer"}
            onClick={handleClick}
            {...props}
        >
            <Text
                color={isSelected ? "fg" : "fg.900"}
                fontSize={"sm"}
                fontWeight={"medium"}
            >
                # {group?.metadata?.name || formatAddress(group.id)}
            </Text>
        </HStack>
    )
}