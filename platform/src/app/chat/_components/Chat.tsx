"use client"

import { useEffect } from "react";
import { Center, Heading, StackProps, Text, VStack } from "@chakra-ui/react";
import { useChannel, useConnectionStateListener } from "ably/react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { Tag } from "@/components/ui/tag";
import { ComposerInput, ComposerInputForDirectMessage } from "./ComposerInput";
import { useChannelName } from "../_hooks/useChannelName";
import { ChatControlPanel } from "./ChatControlPanel";
import { MessageContainer, MessageContainerForDirect } from "./MessageContainer";


interface Props extends StackProps {
    channelType: "DIRECT_CHAT" | "GROUP_CHAT";
}
export function Chat({ channelType, ...props }: Props) {
    const { channelName } = useChannelName();
    const currentAccount = useCurrentAccount();
    const { channel } = useChannel({ channelName });

    useConnectionStateListener('connected', () => {
        if (!currentAccount) return;

        channel.presence.enterClient(currentAccount?.address);
    });

    useEffect(() => {
        if (!currentAccount) return;

        channel.presence.enterClient(currentAccount?.address);

        return () => {
            channel.presence.leaveClient(currentAccount?.address);
        }
    }, [channel, currentAccount]);

    return (
        <VStack
            pos={"relative"}
            flex={4}
            h={"full"}
            zIndex={"0"}
            px={"4"}
            {...props}
        >
            <ChatControlPanel channelType={channelType} />
            {
                channelType === "DIRECT_CHAT" ?
                    <MessageContainerForDirect /> :
                    <MessageContainer />
            }
            {
                channelType === "DIRECT_CHAT" ?
                    <ComposerInputForDirectMessage /> :
                    <ComposerInput />
            }
        </VStack>
    )
}

export function ChatWelcomePlaceholder() {
    return (
        <Center w={"full"} h={"full"} px={"4"}>
            <VStack
                pos={"relative"}
                bg={"bg.200"}
                h={"full"}
                w={"full"}
                rounded={"4xl"}
                p={"4"}
                gap={"4"}
                border={"1px solid"}
                borderColor={"bg.300"}
                justifyContent={"center"}
                alignItems={"center"}
                backdropFilter={"blur(256px)"}
                overflow={"hidden"}
            >
                <Heading as="h3" size={"4xl"} fontWeight={"semibold"}>Welcome to Chatiwal</Heading>
                <Text color={"fg.900"}>Select group to chat and chill</Text>
                <Tag colorPalette={"white"} fontSize={"lg"} outlineWidth={"8px"} py="1" px={"2"}>
                    Your chat, your key, your storage
                </Tag>
            </VStack>
        </Center>
    )
}