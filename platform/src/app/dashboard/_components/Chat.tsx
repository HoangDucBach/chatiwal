"use client"

import { Button } from "@/components/ui/button";
import { StackProps, VStack } from "@chakra-ui/react";
import { MessageBase } from "./messages";
import { MediaType } from "@/types";

interface Props extends StackProps { }
export function Chat(props: Props) {
    return (
        <VStack bg={"bg"} h={"full"} rounded={"4xl"} p={"4"} overflowY={"auto"} {...props}>
            <MessageBase
                message={{
                    id: "msg-001",
                    owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                    groupId: "group-001",
                    content: {
                        text: "Hello! Here's an image and a video.",
                        media: [
                            // {
                            //     id: "media-001",
                            //     type: MediaType.IMAGE,
                            //     url: "https://placekitten.com/300/200",
                            //     name: "Cute kitten",
                            //     dimensions: {
                            //         width: 300,
                            //         height: 200,
                            //     },
                            //     mimeType: "image/jpeg",
                            // },
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
                    groupId: "group-001",
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
                    groupId: "group-001",
                    content: {
                        text: "A example encrypted message, try it with Chatiwal",
                    },
                    createdAt: Date.now(),
                }} />
            <MessageBase
                message={{
                    id: "msg-001",
                    owner: "0xffd4f043057226453aeba59732d41c6093516f54823ebc3a16d17f8a77d2f0ad",
                    groupId: "group-001",
                    content: {
                        text: "Chatiwal ensures secure, encrypted messaging with SEAL, full control over storage on Walrus, and seamless integration with Sui",
                    },
                    createdAt: Date.now(),
                }} />
        </VStack>
    )
}