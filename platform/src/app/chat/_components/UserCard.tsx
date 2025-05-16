"use client"

import { ChatiwalMascotIcon } from "@/components/global/icons";
import { generateColorFromAddress } from "@/libs";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { StackProps, Text, Icon, HStack, Float, Circle, AvatarRoot } from "@chakra-ui/react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { formatAddress } from "@mysten/sui/utils";
import { useQuery } from "@tanstack/react-query";
import { useAbly } from "ably/react";
import { useRouter } from "next/navigation";

interface Props extends StackProps {
    address: string;
    isSelected?: boolean;
}

export function UserCard({ address, isSelected, ...props }: Props) {
    const router = useRouter();
    const currentAccount = useCurrentAccount();
    const ably = useAbly();

    const { data: isOnline } = useQuery({
        queryKey: ["messages::user::get::status", address],
        queryFn: async () => {
            const channel = ably.channels.get(AblyChannelManager.getChannel("INBOX", address));
            if (!channel) return false;
            try {
                const res = await channel.presence.get({ clientId: address });
                return res.length > 0;
            } catch (err) {
                console.error("Failed to get presence:", err);
                return false;
            }
        },
        refetchInterval: 30000,
        staleTime: 25000,
    });

    const handleClick = () => {
        if (!currentAccount) return;

        router.push(`/chat/direct/${address}`);
    }


    return (
        <HStack
            w={"full"}
            transition="all 0.2s ease-in-out"
            _hover={{
                bg: "bg.200",
            }}
            bg={isSelected ? "bg.200" : "transparent"}
            backdropBlur={"2xl"}
            rounded={"2xl"}
            cursor={"pointer"}
            onClick={handleClick}
            {...props}
        >
            <AvatarRoot size={"md"} bg={"transparent"}>
                <Icon as={ChatiwalMascotIcon} size={"lg"} color={generateColorFromAddress(address)} />
                <Float placement="bottom-end" offsetX="1" offsetY="2">
                    <Circle
                        bg={isOnline ? "green.500" : "gray.500"}
                        size="8px"
                    />
                </Float>
            </AvatarRoot>
            <Text
                color={isSelected ? "fg" : "fg.900"}
                fontSize={"sm"}
                fontWeight={"medium"}
            >
                {formatAddress(address)}
            </Text>
        </HStack>
    );
}