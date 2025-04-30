"use client"

import { ChatiwalMascotIcon } from "@/components/global/icons";
import { Button } from "@/components/ui/button"
import { generateColorFromAddress } from "@/libs";
import { TGroup } from "@/types";
import { SUI_EXPLORER_URL } from "@/utils/constants";
import { HStack, StackProps, Text, VStack, Avatar, Icon, Float, Circle, Link } from "@chakra-ui/react"
import { formatAddress, SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { useState } from "react"

interface Props extends StackProps {
    member: string;
    group: TGroup;
    isOnline: boolean;
}
export function MemberCard(props: Props) {
    const { member, isOnline } = props;

    return (
        <HStack
            className="group"
            w={"full"}
            p={"2"}
            transition="all 0.2s ease-in-out"
            backdropBlur={"2xl"}
            rounded={"2xl"}
            cursor={"pointer"}
            {...props}
        >
            <Avatar.Root variant="subtle" bg="transparent">
                <Icon color={generateColorFromAddress(member)}>
                    <ChatiwalMascotIcon size={32} />
                </Icon>
                <Float placement="bottom-end" offsetX="1" offsetY="1">
                    <Circle
                        bg={isOnline ? "green.500" : "gray.500"}
                        size="8px"
                    />
                </Float>
            </Avatar.Root>
            <VStack gap={"1"} alignItems={"start"}>
                <Link
                    color={"fg"}
                    fontWeight={"medium"}
                    href={`${SUI_EXPLORER_URL}/object/${member}`}
                >
                    {formatAddress(member)}
                </Link>
            </VStack>

        </HStack>
    )
}