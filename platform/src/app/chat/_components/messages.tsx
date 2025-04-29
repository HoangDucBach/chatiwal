"use client";

import { Box, BoxProps, Avatar as ChakraAvatar, HStack, Icon, Image, Text, VStack, Float, Circle, For } from "@chakra-ui/react";
import { formatAddress, fromBase64 } from "@mysten/sui/utils";
import { useMemo } from "react";
import ReactPlayer from "react-player";
import { useChannel } from "ably/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";

import { ChatiwalMascotIcon } from "@/components/global/icons";
import { generateColorFromAddress, TypeSuffixRegex } from "@/libs";
import { MediaContent, TMessage, TMessageFeeBased, TMessageLimitedRead, TMessageTimeLock, TMessageType } from "@/types";
import { NoPolicyOptions, SuperMessageCompoundStruct, SuperMessageFeeBasedStruct, SuperMessageLimitedReadStruct } from "@/sdk";
import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { CoinStruct } from "@/sdk/contracts/utils";
import { Button } from "@/components/ui/button";
import { Transaction } from "@mysten/sui/transactions";
import { toaster } from "@/components/ui/toaster";
import { useSealClient } from "@/hooks/useSealClient";
import { useSessionKeys } from "@/hooks/useSessionKeysStore";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { MessageBase as MessageBaseClass } from "@/sdk";

interface ContentProps {
    self?: boolean;
    media: MediaContent;
}

export function Content(props: ContentProps) {
    const { media, self } = props;

    const decodeMediaAsUrl = useMemo(() => {
        if (!media) return null;
        const raw = media.raw;

        if (raw) {
            const blob = new Blob([raw], { type: media.mimeType });
            const url = URL.createObjectURL(blob);
            return url;
        }

        if (media.url) {
            return media.url;
        }

        return null;
    }, [media]);

    const mediaNode = useMemo(() => {
        if (!decodeMediaAsUrl) return null;

        const isImage = media.mimeType.startsWith("image/");
        const isVideo = media.mimeType.startsWith("video/");
        const isAudio = media.mimeType.startsWith("audio/");
        const isText = media.mimeType.startsWith("text/");

        if (isImage) {
            return (
                <Image
                    src={decodeMediaAsUrl}
                    alt={'No preview available'}
                    maxW={["full", "full", "full", "64"]}
                    h={"full"}
                    objectFit={"cover"}
                    rounded={"2xl"}
                />
            );
        }

        if (isVideo || isAudio) {
            return (
                <Box
                    width={["full", "full", "full", "96"]}
                    borderRadius="2xl"
                    overflow="hidden"
                    bg="black"
                >
                    <ReactPlayer
                        url={decodeMediaAsUrl}
                        width="100%"
                        height="100%"
                        controls
                        playing={false}
                        style={{ borderRadius: "inherit", aspectRatio: "16/9" }}
                    />
                </Box>
            );
        }

        if (isText) {
            return (
                <Text
                    fontSize={"md"}
                    color={"fg"}
                    w={["full", "full", "full", "fit"]}
                >
                    {media.raw}
                </Text>
            );
        }

        return null;
    }, [media]);

    return (
        <VStack align={"start"} justify={"start"} gap={"1"} w={["full", "full", "fit", "fit"]}>
            {mediaNode}
        </VStack>
    )
}
interface MessageBaseProps extends BoxProps {
    message: TMessage;
    self?: boolean;
}
export function MessageBase(props: MessageBaseProps) {
    const { message, self = true } = props;
    const channelName = message.groupId;
    const { channel } = useChannel({ channelName })
    const { decryptMessage, createMessageSessionKey } = useSealClient();
    const { setMessageKey, getGroupKey, messageKeys } = useSessionKeys();
    const { read } = useWalrusClient();
    const { data: content, isLoading: isDecrypting } = useQuery({
        queryKey: ["messages::group::decypt", message.id],
        queryFn: async () => {
            // const messageBase = new MessageBaseClass({
            //     id: message.id,
            //     data: {
            //         blobId: message.blobId,
            //         content: message.content
            //     },
            //     groupId: message.groupId,
            //     owner: message.owner
            // } as NoPolicyOptions)

            // let messageKey = getGroupKey(message.groupId);
            // console.log("messageKey", messageKey);
            // if (!messageKey) return null;

            // const blobId = messageBase.getData().blobId;
            // if (blobId) {
            //     const decryptedBlob = await read(["e3n0ay6xDJ4de4nzLe7c6o-o8ZkxYrF3MrfmaYU2Qqc"]);
            //     const decryptedMessageBase = await decryptMessage(messageBase, messageKey);
            // }

            // // messageBase.setData({
            // //     content: decode(new Uint8Array(decryptedBlob[0])),
            // // })
            // const decryptedMessageBase = await decryptMessage(messageBase, messageKey);
            // console.log("decryptedMessage 123", decryptedMessageBase);
            // return decryptedMessageBase.getData().content;
            return message.content;
        },
        enabled: !!message.id && !!messageKeys,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity
    })
    const { data: isOnline } = useQuery({
        queryKey: ["messages::group::get::status", message.id],
        queryFn: async () => {
            const res = await channel.presence.get({
                clientId: message.owner,
            });

            return res.length > 0;
        },
    })

    if (!message) return null;

    const Avatar = () => {
        return (
            <ChakraAvatar.Root variant="subtle">
                <Icon color={generateColorFromAddress(message.owner)}>
                    <ChatiwalMascotIcon size={32} />
                </Icon>
                <Float placement="bottom-end" offsetX="1" offsetY="1">
                    <Circle
                        bg={isOnline ? "green.500" : "gray.500"}
                        size="6px"
                        outline="0.2em solid"
                        outlineColor="bg"
                    />
                </Float>
            </ChakraAvatar.Root>
        )
    };

    const Header = () => {
        return (
            <HStack flexDirection={self ? "row-reverse" : "row"}>
                {
                    <Text
                        fontSize={"md"}
                        color={"fg"}
                        fontWeight={"medium"}
                    >
                        {self ? "You" : formatAddress(message.owner)}
                    </Text>
                }
                <Text
                    fontSize={"sm"}
                    color={"fg.800"}
                    fontWeight={"medium"}
                >
                    {new Date(message?.createdAt!).toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </Text>
            </HStack>
        )
    };

    return (
        <HStack
            w={"full"}
            align={"center"}
            justify={self ? "end" : "start"}
        >
            <VStack
                w={"full"}
                align={self ? "end" : "start"}
                justify={self ? "end" : "start"}
                gap={"2"}
            >
                <Box
                    w={["100%", "80%", "70%", "fit"]}
                    maxW={[undefined, undefined, undefined, "80%"]}
                    h={"fit"}
                    p={"2"}
                    {...props}
                >
                    <VStack justify={"start"} align={self ? "end" : "start"} >
                        <Avatar />
                        <VStack align={self ? "end" : "start"} w={"full"} gap={"1"}>
                            <Header />
                            {content && !isDecrypting ?
                                <For each={content} fallback={<Text color={"fg.contrast"}>No content</Text>}>
                                    {(media, index) => (
                                        <Content
                                            self={self}
                                            key={index}
                                            media={media}
                                        />
                                    )}
                                </For>
                                :
                                <Text color={"fg.contrast"}>***</Text>
                            }
                        </VStack>
                    </VStack>
                </Box>
                {props.children}
            </VStack>
        </HStack>
    )
}

interface SuperMessageLimitedReadProps extends Omit<MessageBaseProps, "message"> {
    messageId: string;
}
export function SuperMessageLimitedRead(props: SuperMessageLimitedReadProps) {
    const { messageId, self = true } = props;
    const currentAccount = useCurrentAccount();
    const { readMessageLimitedRead } = useChatiwalClient()
    const { decryptMessage, createMessageSessionKey, encryptMessage } = useSealClient();
    const { setMessageKey, getMessageKey, messageKeys } = useSessionKeys();
    const suiClient = useSuiClient();
    const { data: messageLimitedRead, isLoading: isLoadingData, error } = useQuery({
        queryKey: ["messages::group::get::object", messageId],
        queryFn: async () => {
            const res = await suiClient.getObject({
                id: messageId,
                options: {
                    showBcs: true,
                },
            });

            if (!res) {
                throw new Error("Failed to get message");
            }

            const bcsData = res.data?.bcs as unknown as { bcsBytes: string, type: string };
            const objectData = SuperMessageLimitedReadStruct.parse(fromBase64(bcsData.bcsBytes));

            return {
                id: messageId,
                groupId: objectData.group_id,
                owner: objectData.owner,
                type: TMessageType.LIMITED_READ,
                policy: {
                    maxReads: BigInt(objectData.policy.max),
                },
                blobId: objectData.message_blob_id,
                readers: objectData.readers,
            } satisfies TMessageLimitedRead;
        },
        enabled: !!messageId,
    })

    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const { mutate: read } = useMutation({
        mutationKey: ["messages::group::read", messageId],
        mutationFn: async () => {
            console.log("messageLimitedRead");
            if (!messageLimitedRead) {
                throw new Error("Message not found");
            }

            if (!currentAccount) {
                throw new Error("Not connected");
            }

            // const messageBase = new MessageBaseClass({
            //     data: {
            //         content: "Hoang Duc Bach",
            //     },
            //     groupId: messageLimitedRead.groupId,
            //     owner: currentAccount.address,
            // } as MessageOptions)

            // const testMessage = await encryptMessage(messageBase);
            // const sessionKey = await createMessageSessionKey(testMessage.getId())
            // await decryptMessage(testMessage, sessionKey);
            // console.log("testMessage", testMessage);
            return;
            const tx = await readMessageLimitedRead(messageLimitedRead.id);

            const { digest } = await signAndExecuteTransaction({
                transaction: tx,
            });

            const { effects } = await suiClient.waitForTransaction({
                digest,
                options: { showEffects: true },
            });

            if (effects?.status.status == 'failure') {
                throw new Error('Failed to read message');
            }

        },
        onError(error, variables, context) {
            console.log("error", error);
        },
        onSuccess(data, variables, context) {
            toaster.success({
                title: "Success",
                description: "Subscribe to read message successfully",
            });
        },
    })

    const { mutate: getSessionKey } = useMutation({
        mutationKey: ["message::decrypt", messageId],
        mutationFn: async () => {
            const oldSessionKey = getMessageKey(messageId);
            if (oldSessionKey) return;

            const sessionKey = await createMessageSessionKey(messageId);
            setMessageKey(messageId, sessionKey);
            console.log("messageKey", messageKeys);
        },
        onError(error, variables, context) {
            console.log("error", error);
        },
    })
    if (!messageLimitedRead) return <div>{error?.message}</div>;

    const handleClick = async () => {
        const isReader = messageLimitedRead.readers.includes(currentAccount?.address!);
        read();
        // if (!isReader) read();
        // else getSessionKey();
    }

    return (
        <MessageBase
            message={messageLimitedRead}
            self={self}
        >
            <Button
                variant={"solid"}
                colorPalette={"primary"}
                size={"sm"}
                onClick={handleClick}
            >
                Read
            </Button>
        </MessageBase>
    )
}

interface SuperMessageFeeBasedProps extends Omit<MessageBaseProps, "message"> {
    messageId: string;
}
export function SuperMessageFeeBased(props: SuperMessageFeeBasedProps) {
    const { messageId, self = true } = props;
    const currentAccount = useCurrentAccount();
    const { readMessageFeeBased } = useChatiwalClient()
    const suiClient = useSuiClient();
    const { data: messageFeeBased, isLoading: isLoadingData, error } = useQuery({
        queryKey: ["messages::group::get::object", messageId],
        queryFn: async () => {
            const res = await suiClient.getObject({
                id: messageId,
                options: {
                    showBcs: true,
                },
            });

            if (!res) {
                throw new Error("Failed to get message");
            }

            const bcsData = res.data?.bcs as unknown as { bcsBytes: string, type: string };
            const type = bcsData.type;
            const objectData = SuperMessageFeeBasedStruct(CoinStruct).parse(fromBase64(bcsData.bcsBytes));

            return {
                id: messageId,
                groupId: objectData.group_id,
                owner: objectData.owner,
                type: TMessageType.FEE_BASED,
                policy: {
                    fee: objectData.policy.fee_amount,
                    recipient: objectData.policy.recipient,
                },
                readers: objectData.readers,
                feeCollected: objectData.fee_collected,
                coinType: type.match(TypeSuffixRegex)?.[1] ?? "0x2::sui::SUI",
            } satisfies TMessageFeeBased;
        },
        enabled: !!messageId,
    })

    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const { mutate: read } = useMutation({
        mutationKey: ["messages::group::read", messageId],
        mutationFn: async () => {
            if (!messageFeeBased) {
                throw new Error("Message not found");
            }

            if (!currentAccount) {
                throw new Error("Not connected");
            }

            const coinType = messageFeeBased.coinType;
            const coins = await suiClient.getCoins({
                owner: currentAccount?.address,
                coinType,
            });
            console.log("coins", coins);
            let seletedCoin = coins.data.find((coin) => {
                return BigInt(coin.balance) >= BigInt(messageFeeBased.policy.fee);
            });

            if (!seletedCoin) {
                throw new Error("Insufficient balance");
            }
            const splitTx = new Transaction();
            const [splitCoin] = splitTx.splitCoins(
                splitTx.object(seletedCoin.coinObjectId),
                [splitTx.pure("u64", messageFeeBased.policy.fee)]
            );
            splitTx.transferObjects([splitCoin], splitTx.pure("address", currentAccount.address));

            const { digest: splitDigest } = await signAndExecuteTransaction({
                transaction: splitTx,
            })

            await suiClient.waitForTransaction({ digest: splitDigest });

            const coinsAfterSplit = await suiClient.getCoins({
                owner: currentAccount.address,
                coinType: coinType,
            });
            const feeSplitCoin = coinsAfterSplit.data.find((coin) => {
                return BigInt(coin.balance) >= BigInt(messageFeeBased.policy.fee);
            })

            if (!feeSplitCoin) {
                throw new Error("Not insufficient balance");
            }

            const tx = new Transaction();
            await readMessageFeeBased(messageFeeBased.id, feeSplitCoin.coinObjectId, BigInt(messageFeeBased.policy.fee), messageFeeBased.coinType, tx);
            tx.setGasPayment([{
                digest: seletedCoin.digest,
                objectId: seletedCoin.coinObjectId,
                version: seletedCoin.version,
            }])

            const { digest } = await signAndExecuteTransaction({
                transaction: tx,
            });

            const { effects } = await suiClient.waitForTransaction({
                digest,
                options: { showEffects: true },
            });

            if (effects?.status.status == 'failure') {
                throw new Error('Failed to read message');
            }
        },
        onError(error, variables, context) {
            console.log("error", error);
        },
        onSuccess(data, variables, context) {
            console.log("data", data);
            toaster.success({
                title: "Success",
                description: "Subscribe to read message successfully",
            });
        },
    })

    if (!messageFeeBased) return <div>{error?.message}</div>;

    return (
        <MessageBase
            message={messageFeeBased}
            self={self}
        >
            <Button
                variant={"solid"}
                colorPalette={"primary"}
                size={"sm"}
                onClick={() => {
                    read();
                }}
            >
                Read
            </Button>
        </MessageBase>
    )
}

interface SuperMessageTimeLockProps extends MessageBaseProps {
    message: TMessageTimeLock;
    self?: boolean;
}
export function SuperMessageTimeLock(props: SuperMessageTimeLockProps) {
}

interface SuperMessageCompoundProps extends MessageBaseProps {
    messageId: string;
}
export function SuperMessageCompound(props: SuperMessageCompoundProps) {
    const { message, self = true } = props;
    const channelName = message.groupId;
    const { channel } = useChannel({ channelName })
    const { data: isOnline } = useQuery({
        queryKey: ["messages::group::get", message.id],
        queryFn: async () => {
            const res = await channel.presence.get({
                clientId: message.owner,
            });

            return res.length > 0;
        },
    })
    const { readMessageCompound } = useChatiwalClient()
    const suiClient = useSuiClient();
    const { data: objectMessageCompound } = useQuery({
        queryKey: ["messages::group::get", message.id],
        queryFn: async () => {
            const res = await suiClient.getObject({
                id: message.id,
                options: {
                    showBcs: true,
                },
            });

            if (!res) {
                throw new Error("Failed to get message");
            }

            const bcs = res.data?.bcs as unknown as { content: Uint8Array };
            return SuperMessageCompoundStruct.parse(bcs.content);
        },
    })
}