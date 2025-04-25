"use client"

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Box, chakra, Heading, HStack, Input, InputProps, StackProps, Text, VStack, Textarea, TextareaProps, CenterProps, Center } from "@chakra-ui/react";
import { useChannel, useConnectionStateListener } from "ably/react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { MessageBase } from "./messages";
import { MediaType, TMessage, TMessageBase } from "@/types";
import { useSealClient } from "@/hooks/useSealClient";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { SuperMessageNoPolicy } from "@/sdk";
import { toaster } from "@/components/ui/toaster";
import { useGroup } from "../_hooks/useGroupId";
import { Tag } from "@/components/ui/tag";
import { MintSuperMessage } from "./MintSuperMessage";

const ScrollMotionVStack = motion.create(VStack);

interface Props extends StackProps {
}
export function Chat(props: Props) {
    const { group } = useGroup();
    const channelName = group.id;
    const currentAccount = useCurrentAccount();
    const { decryptMessage } = useSealClient();
    const { channel } = useChannel({ channelName });
    const [messages, setMessages] = useState<TMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const onMessageSend = async (plainMessage: TMessageBase) => {
        setMessages((previousMessages: any) => [...previousMessages, plainMessage]);
    }

    useConnectionStateListener('connected', () => {
        if (!currentAccount) return;

        channel.presence.enterClient(currentAccount?.address);
    });

    useChannel({ channelName }, AblyChannelManager.EVENTS.MESSAGE_SEND, async (message) => {
        try {
            if (message.clientId === currentAccount?.address) {
                return;
            }

            const messageData = message.data as TMessage;
            const encryptedMessage = new SuperMessageNoPolicy({
                id: messageData.id,
                data: {
                    content: messageData.content,
                },
                groupId: messageData.groupId,
                owner: messageData.owner,
            });
            const decryptedMessage = await decryptMessage(encryptedMessage);
            const decryptedMessageData: TMessageBase = {
                id: decryptedMessage.getId(),
                groupId: messageData.groupId,
                owner: messageData.owner,
                content: decryptedMessage.getData().content,
                createdAt: Date.now(),
            }

            setMessages((previousMessages: any) => [...previousMessages, decryptedMessageData]);
        } catch (error) {
            toaster.error({
                title: "Error",
                description: error,
            })
        }
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!currentAccount) return;

        channel.presence.enterClient(currentAccount?.address);

        return () => {
            channel.presence.leaveClient(currentAccount?.address);
        }
    }, [channel, currentAccount]);

    return (
        <VStack pos={"relative"} bg={"bg.50"} h={"full"} rounded={"4xl"} p={"4"} overflowY={"auto"} overflowX={"hidden"} zIndex={"0"} {...props}>
            <ScrollMotionVStack
                h={"full"} overflowY={"auto"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
            >
                <MessageBase
                    message={{
                        id: "msg-001",
                        owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                        groupId: channelName,
                        content: {
                            text: "Hello! Here's an image and a video.",
                            media: [
                                {
                                    id: "media-002",
                                    type: MediaType.VIDEO,
                                    url: "https://www.w3schools.com/html/mov_bbb.mp4",
                                    name: "Sample video",
                                    duration: 10,
                                    size: 1048576,
                                    mimeType: "video/mp4",
                                }
                            ],
                        },
                        createdAt: Date.now(),
                    }} />
                <MessageBase
                    self={false}
                    message={{
                        id: "msg-001",
                        owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                        groupId: channelName,
                        content: {
                            text: "Hello! Here's an image and a video.",
                            media: [
                                {
                                    id: "media-001",
                                    type: MediaType.IMAGE,
                                    url: "https://img.freepik.com/premium-photo/nature-background-people-animal-game-architecture-logo-mockup_1086760-37566.jpg?semt=ais_hybrid&w=740",
                                    name: "Cute kitten",
                                    dimensions: {
                                        width: 300,
                                        height: 200,
                                    },
                                    mimeType: "image/jpeg",
                                },
                            ],
                        },
                        createdAt: Date.now(),
                    }} />
                <MessageBase
                    self={false}
                    message={{
                        id: "msg-001",
                        owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                        groupId: channelName,
                        content: {
                            text: "A example encrypted message, try it with Chatiwal",
                        },
                        createdAt: Date.now(),
                    }} />
                <MessageBase
                    message={{
                        id: "msg-001",
                        owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                        groupId: channelName,
                        content: {
                            text: "Chatiwal ensures secure, encrypted messaging with SEAL, full control over storage on Walrus, and seamless integration with Sui",
                        },
                        createdAt: Date.now(),
                    }} />
                {messages.map((message: TMessageBase) => (
                    <MessageBase
                        key={message.id}
                        message={message}
                        self={message.owner === currentAccount?.address}
                    />
                ))}
                <div ref={messagesEndRef} />
            </ScrollMotionVStack>
            <ComposerInput
                messageInputProps={{
                    channelName,
                    onMessageSend
                }} />
            <Effects />
        </VStack>
    )
}

export function ChatWelcomePlaceholder(props: Props) {
    return (
        <VStack
            pos={"relative"}
            bg={"bg.100"}
            h={"full"}
            rounded={"4xl"}
            p={"4"}
            gap={"4"}
            justifyContent={"center"}
            alignItems={"center"}
            overflow={"hidden"}
            {...props}
        >
            <Heading as="h3" size={"4xl"} fontWeight={"semibold"}>Welcome to Chatiwal</Heading>
            <Box
                pos={"absolute"}
                translateX={"-50%"}
                translateY={"-50%"}
                w={"32"}
                h={"32"}
                bg={"primary"}
                borderRadius={"full"}
                filter={"blur(96px)"}
            />
            <Text color={"fg.900"}>Select group to chat and chill</Text>
            <Tag colorPalette={"white"} fontSize={"lg"} outlineWidth={"8px"} py="1" px={"2"}>
                Your chat, your key, your storage
            </Tag>
        </VStack>
    )
}

interface MessageInputProps extends Omit<TextareaProps, 'onChange'> {
    channelName: string;
    onMessageSend: (plainMessage: TMessageBase, encryptedMessage: TMessageBase) => void;
}
function MessageInput({ channelName, onMessageSend, ...props }: MessageInputProps) {

    const { channel } = useChannel({ channelName });
    const [message, setMessage] = useState<string>("");
    const { encryptMessage } = useSealClient();
    const currentAccount = useCurrentAccount();

    const handlePublish = async () => {
        if (!message) return;
        if (!currentAccount) return;

        const messageBase = new SuperMessageNoPolicy({
            groupId: channelName,
            owner: currentAccount.address,
            data: {
                content: {
                    text: message,
                    media: [],
                },
            }
        })
        const selfMessageData: TMessageBase = {
            id: messageBase.getId(),
            groupId: channelName,
            owner: currentAccount.address,
            content: {
                text: message,
            },
            createdAt: Date.now(),
        }

        const encryptedMessage = await encryptMessage(messageBase);

        const encryptedMessageData: TMessageBase = {
            id: encryptedMessage.getId(),
            groupId: channelName,
            owner: currentAccount.address,
            content: messageBase.getData().content,
            createdAt: Date.now(),
        }

        channel.publish(AblyChannelManager.EVENTS.MESSAGE_SEND, encryptedMessageData)

        onMessageSend(selfMessageData, encryptedMessageData);
    }

    return (
        <Textarea
            bg={"bg.200"}
            resize={"none"}
            placeholder="Message"
            rounded={"2xl"}
            variant={"subtle"}
            size={"lg"}
            shadow={"custom.sm"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    handlePublish();
                    setMessage("");
                }
            }}
            {...props}
        />
    )
}

interface ComposerInputProps extends StackProps {
    messageInputProps: {
        channelName: string;
        onMessageSend: (plainMessage: TMessageBase, encryptedMessage: TMessageBase) => void;
    };
}
function ComposerInput({ messageInputProps, ...props }: ComposerInputProps) {
    return (
        <VStack
            w={"full"}
            p={"3"}
            bg={"bg.100/75"}
            backdropBlur={"2xl"}
            shadow={"custom.sm"}
            rounded={"3xl"}
            cursor={"pointer"}
            {...props}
        >
            <MessageInput
                channelName={messageInputProps.channelName}
                onMessageSend={messageInputProps.onMessageSend}
            />
            <HStack justify={"end"}>
                <MintSuperMessage />
            </HStack>
        </VStack>
    )
}
interface EffectsProps extends CenterProps {

}
function Effects(props: EffectsProps) {
    return (
        <chakra.div
            pos={"absolute"}
            bottom={0}
            left={0}
            w={"full"}
            h={"full"}
            zIndex={"-1"}
            pointerEvents={"none"}
            {...props}
        >
            <Box
                pos={"absolute"}
                w={"full"}
                h={"32"}
                bottom={"0"}
                filter={"blur(32px)"}
                rounded={"3xl"}
                bgGradient={"to-t"}
                gradientFrom={"primary/75"}
                gradientVia={"primary/10"}
                gradientTo={"primary/0"}
            // pointerEvents={"none"}
            />
        </chakra.div>
    )
}