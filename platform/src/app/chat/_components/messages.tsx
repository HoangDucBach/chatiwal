"use client";

import { Box, BoxProps, Avatar as ChakraAvatar, HStack, Icon, Image, chakra, Text, VStack, Float, Circle } from "@chakra-ui/react";
import { formatAddress } from "@mysten/sui/utils";
import { useMemo } from "react";
import ReactPlayer from "react-player";
import { useChannel } from "ably/react";
import { useQuery } from "@tanstack/react-query";

import { ChatiwalMascotIcon } from "@/components/global/icons";
import { generateColorFromAddress } from "@/libs";
import { MediaContent, TMessageBase } from "@/types";

interface ContentProps {
    self?: boolean;
    text?: string;
    media?: MediaContent;
}

export function Content(props: ContentProps) {
    const { text, media, self } = props;

    const mediaNode = useMemo(() => {
        if (!media) return null;

        const isImage = media.mimeType.startsWith("image/");
        const isVideo = media.mimeType.startsWith("video/");
        const isAudio = media.mimeType.startsWith("audio/");
        const isText = media.mimeType.startsWith("text/");

        if (isImage) {
            return (
                <Image
                    src={media.url}
                    alt={media.name}
                    w={["full", "full", "full", "96"]}
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
                        url={media.url}
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
                    fontSize={"sm"}
                    color={"fg"}
                    w={["full", "full", "full", "fit"]}
                >
                    {text}
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
    message: TMessageBase;
    self?: boolean;
}
export function MessageBase(props: MessageBaseProps) {
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
                        {/* <VStack align={self ? "end" : "start"} w={"full"} gap={"1"}>
                            <Header />
                            {message.content.text && <Content self={self} text={message.content.text} />}
                        </VStack> */}
                    </VStack>
                </Box>
                <HStack flexWrap={"wrap"}>
                    {message.content && message.content.map((media, index) => (
                        <Content
                            self={self}
                            key={index}
                            media={media}
                        />
                    ))}
                </HStack>
            </VStack>
        </HStack>
    )
}