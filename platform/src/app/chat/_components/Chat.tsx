"use client"

import { useEffect, useState } from "react";
import { Heading, StackProps, Text, VStack } from "@chakra-ui/react";
import { useChannel, useConnectionStateListener } from "ably/react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { TMessage } from "@/types";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { useGroup } from "../_hooks/useGroupId";
import { Tag } from "@/components/ui/tag";
import { ComposerInput } from "./ComposerInput";
import { decode } from "@msgpack/msgpack";
import { GroupControlPanel } from "./GroupControlPanel";


interface Props extends StackProps {
}
export function Chat(props: Props) {
    const { group } = useGroup();
    const channelName = group.id;
    const currentAccount = useCurrentAccount();
    const { channel } = useChannel({ channelName });
    const [messages, setMessages] = useState<TMessage[]>([]);

    const onMessageSend = async (plainMessage: TMessage) => { }

    useConnectionStateListener('connected', () => {
        if (!currentAccount) return;

        channel.presence.enterClient(currentAccount?.address);
    });

    useChannel({ channelName }, AblyChannelManager.EVENTS.MESSAGE_SEND, async (message) => {
        try {
            const messageData = decode(message.data) as TMessage;
            setMessages((previousMessages) => [...previousMessages, messageData]);
            console.log([messageData, messages]);
        } catch (error) {
            console.log(error)
        }
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
            bg={"bg.200/75"}
            h={"full"}
            p={"4"}
            backdropFilter={"blur(256px)"}
            rounded={"4xl"}
            shadow={"custom.lg"}
            zIndex={"0"} {...props}
        >
            <GroupControlPanel chatTabProps={{ messages }} />
            <ComposerInput
                messages={messages}
                messageInputProps={{
                    channelName,
                    onMessageSend
                }}
            />
        </VStack>
    )
}

export function ChatWelcomePlaceholder(props: Props) {
    return (
        <VStack
            pos={"relative"}
            bg={"bg.200/75"}
            h={"full"}
            rounded={"4xl"}
            p={"4"}
            gap={"4"}
            justifyContent={"center"}
            alignItems={"center"}
            backdropFilter={"blur(256px)"}
            overflow={"hidden"}
            {...props}
        >
            <Heading as="h3" size={"4xl"} fontWeight={"semibold"}>Welcome to Chatiwal</Heading>
            <Text color={"fg.900"}>Select group to chat and chill</Text>
            <Tag colorPalette={"white"} fontSize={"lg"} outlineWidth={"8px"} py="1" px={"2"}>
                Your chat, your key, your storage
            </Tag>
        </VStack>
    )
}