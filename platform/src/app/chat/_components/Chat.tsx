"use client"

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Box, Heading, HStack, StackProps, Text, VStack, Textarea, TextareaProps, Center } from "@chakra-ui/react";
import { useChannel, useConnectionStateListener } from "ably/react";
import { useCurrentAccount } from "@mysten/dapp-kit";

import { MessageBase } from "./messages";
import { TMessage, TMessageBase } from "@/types";
import { useSealClient } from "@/hooks/useSealClient";
import { AblyChannelManager } from "@/libs/ablyHelpers";
import { SuperMessageNoPolicy } from "@/sdk";
import { toaster } from "@/components/ui/toaster";
import { useGroup } from "../_hooks/useGroupId";
import { Tag } from "@/components/ui/tag";
import { ComposerInput } from "./MintSuperMessage";
import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useForm } from "react-hook-form";

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
        <VStack
            pos={"relative"}
            bg={"bg.200/75"}
            h={"full"}
            p={"6"}
            backdropFilter={"blur(256px)"}
            rounded={"4xl"}
            shadow={"custom.lg"}
            zIndex={"0"} {...props}
        >
            <Center p={"6"} pos={"relative"} flex={"1"} w={"full"}>
                <ScrollMotionVStack
                    px={"6"}
                    pos={"absolute"}
                    flex={"1"}
                    w={"full"}
                    h={"full"}
                    overflowY={"auto"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.1 }}
                >
                    <MessageBase
                        self={false}
                        message={{
                            id: "msg-001",
                            owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                            groupId: channelName,
                            content: [
                                {
                                    id: "media-001",
                                    url: "https://img.freepik.com/premium-photo/nature-background-people-animal-game-architecture-logo-mockup_1086760-37566.jpg?semt=ais_hybrid&w=740",
                                    dimensions: {
                                        width: 300,
                                        height: 200,
                                    },
                                    mimeType: "image/jpeg",
                                },
                            ],
                            createdAt: Date.now(),
                        }} />
                    <MessageBase
                        self={false}
                        message={{
                            id: "msg-001",
                            owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                            groupId: channelName,
                            createdAt: Date.now(),
                        }} />
                    <MessageBase
                        self={false}
                        message={{
                            id: "msg-001",
                            owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                            groupId: channelName,
                            createdAt: Date.now(),
                        }} />
                    <MessageBase
                        message={{
                            id: "msg-001",
                            owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                            groupId: channelName,
                            content: [
                                {
                                    id: "media-001",
                                    raw: new TextEncoder().encode("Hello world"),
                                    name: "Cute kitten",
                                    mimeType: "text/plain",
                                }
                            ],
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
            </Center>
            <ComposerInput
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

// interface MessageInputProps extends Omit<TextareaProps, 'onChange'> {
//     channelName: string;
//     onMessageSend: (plainMessage: TMessageBase, encryptedMessage: TMessageBase) => void;
// }
// function MessageInput({ channelName, onMessageSend, ...props }: MessageInputProps) {

//     const { channel } = useChannel({ channelName });
//     const [message, setMessage] = useState<string>("");
//     const { encryptMessage } = useSealClient();
//     const currentAccount = useCurrentAccount();

//     const handlePublish = async () => {
//         if (!message) return;
//         if (!currentAccount) return;

//         const messageBase = new SuperMessageNoPolicy({
//             groupId: channelName,
//             owner: currentAccount.address,
//             data: {
//                 content: {
//                     text: message,
//                     media: [],
//                 },
//             }
//         })
//         const selfMessageData: TMessageBase = {
//             id: messageBase.getId(),
//             groupId: channelName,
//             owner: currentAccount.address,
//             content: [
//                 {
//                     id: "media-001",
//                     raw: new TextEncoder().encode(message),
//                     name: "Cute kitten",
//                     mimeType: "text/plain",
//                 }
//             ],
//             createdAt: Date.now(),
//         }

//         const encryptedMessage = await encryptMessage(messageBase);

//         const encryptedMessageData: TMessageBase = {
//             id: encryptedMessage.getId(),
//             groupId: channelName,
//             owner: currentAccount.address,
//             content: messageBase.getData().content,
//             createdAt: Date.now(),
//         }

//         channel.publish(AblyChannelManager.EVENTS.MESSAGE_SEND, encryptedMessageData)

//         onMessageSend(selfMessageData, encryptedMessageData);
//     }

//     return (
//         <Textarea
//             bg={"bg.200"}
//             resize={"none"}
//             placeholder="Message"
//             _placeholder={{
//                 color: "fg.contrast"
//             }}
//             rounded={"2xl"}
//             variant={"subtle"}
//             size={"lg"}
//             shadow={"custom.sm"}
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             onKeyDown={(e) => {
//                 if (e.key === "Enter") {
//                     handlePublish();
//                     setMessage("");
//                 }
//             }}
//             {...props}
//         />
//     )
// }

// interface FormValues {
//     messageText: string;
//     messageType: string;
//     metadataBlobId: string;
//     timeFrom: number;
//     timeTo: number;
//     maxReads: number;
//     fee: number;
//     recipient: string;
//     coinType: string;
// }


// interface ComposerInputProps extends StackProps {
//     messageInputProps: {
//         channelName: string;
//         onMessageSend: (plainMessage: TMessageBase, encryptedMessage: TMessageBase) => void;
//     };
// }
// function ComposerInput({ messageInputProps, ...props }: ComposerInputProps) {
//     const {
//         mint_super_message_time_lock_and_transfer,
//         mint_super_message_no_policy_and_transfer,
//         mint_super_message_fee_based_and_transfer,
//         mint_super_message_limited_read_and_transfer,
//         mint_super_message_compound_and_transfer,
//     } = useChatiwalClient()

//     const {
//         handleSubmit,
//         control,
//         watch,
//         formState: { errors },
//         reset: resetForm,
//         setValue, // To set messageText
//         getValues // To get messageText during submit if needed (though Controller is better)
//     } = useForm<FormValues>({
//         defaultValues: {
//             messageText: '', // Initialize message text
//             messageType: 'no_policy', // Default to no policy
//             metadataBlobId: '',
//             timeFrom: Math.floor(Date.now() / 1000),
//             timeTo: Math.floor(Date.now() / 1000) + 86400, // 1 day later
//             maxReads: 1,
//             fee: 0,
//             recipient: '',
//             coinType: '0x2::sui::SUI', // Default SUI coin type
//         }
//     });

//     const messageType = watch('messageType');
//     const messageText = watch('messageText');

//     // --- Submit Handler ---
//     const onSubmit = (data: FormValues) => {
//         // ** Crucial Step: Handle messageText -> metadataBlobId **
//         // If you need to create a metadata blob from data.messageText here,
//         // do it now and get the resulting ID. Replace data.metadataBlobId if necessary.
//         // Example (pseudo-code):
//         // let finalMetadataBlobId = data.metadataBlobId;
//         // if (!finalMetadataBlobId && data.messageText) {
//         //    try {
//         //       finalMetadataBlobId = await createMetadataBlob(data.messageText); // Your function
//         //    } catch (blobError) {
//         //       toaster.error({ title: "Metadata Error", description: "Failed to prepare message metadata." });
//         //       return;
//         //    }
//         // } else if (!finalMetadataBlobId && data.messageType !== 'no_policy') {
//         //     // Require blob ID if not automatically created and policy needs it
//         //     toaster.error({ title: "Input Error", description: "Metadata Blob ID is required for this policy." });
//         //     return;
//         // }

//         // For now, we proceed assuming data.metadataBlobId is correct or handled implicitly

//         if (!group?.id) {
//             toaster.error({ title: "Error", description: "Group context is missing." });
//             return;
//         }

//         try {
//             const params: Partial<MintParams> & { type: SuperMessageType, groupId: string, metadataBlobId: string } = {
//                 type: data.messageType,
//                 groupId: group.id, // Use group id from hook
//                 metadataBlobId: data.metadataBlobId, // Use blob ID from form
//                 // messageContent: data.messageText // Maybe pass text separately if needed by mutation?
//             };

//             // Add policy-specific parameters, converting to BigInt where needed
//             switch (data.messageType) {
//                 case 'time_lock':
//                     params.timeFrom = BigInt(data.timeFrom);
//                     params.timeTo = BigInt(data.timeTo);
//                     break;
//                 case 'limited_read':
//                     params.maxReads = BigInt(data.maxReads);
//                     break;
//                 case 'fee_based':
//                     params.fee = BigInt(data.fee); // Already BigInt in mutation, but ensure conversion if needed
//                     params.recipient = data.recipient;
//                     params.coinType = data.coinType;
//                     break;
//                 case 'compound':
//                     params.timeFrom = BigInt(data.timeFrom);
//                     params.timeTo = BigInt(data.timeTo);
//                     params.maxReads = BigInt(data.maxReads);
//                     params.fee = BigInt(data.fee); // Already BigInt in mutation
//                     params.recipient = data.recipient;
//                     params.coinType = data.coinType;
//                     break;
//                 // No extra params for 'no_policy'
//             }

//             mintSuperMessage(params as MintParams); // Assert as full MintParams

//         } catch (error) {
//             console.error("Pre-mutation validation error:", error);
//             toaster.error({
//                 title: "Validation Error",
//                 description: error instanceof Error ? error.message : "Invalid input values",
//                 duration: 5000,
//             });
//         }
//     };


//     return (
//         <VStack
//             w={"full"}
//             p={"3"}
//             bg={"bg.100/75"}
//             backdropBlur={"2xl"}
//             shadow={"custom.sm"}
//             rounded={"3xl"}
//             cursor={"pointer"}
//             {...props}
//         >
//             <MessageInput
//                 channelName={messageInputProps.channelName}
//                 onMessageSend={messageInputProps.onMessageSend}
//             />
//             <HStack justify={"end"}>
//                 <MintSuperMessage />
//             </HStack>
//         </VStack>
//     )
// }