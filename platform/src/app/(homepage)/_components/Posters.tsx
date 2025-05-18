"use client";

import { Center, HStack, Image, Stack, StackProps } from "@chakra-ui/react";
import NextImage from "next/image";

interface Props extends StackProps {
}

export function Posters({ ...props }: Props) {
    return (
        <Stack
            flexDirection={["column", "row", "row"]}
            align={"center"}
            justify={"center"}
            gap={"8"}
            p={"6"}
            overflow={"visible"}
        >
            <Image
                src={"/assets/poster-super-message.png"}
                alt={"poster-super-message"}
                objectFit="cover"
                maxW={"md"}
                flex={"1"}
                w={"full"}
                h={"auto"}
            />
            <Image
                src={"/assets/poster-basic-message.png"}
                alt={"poster-basic-message"}
                objectFit="cover"
                maxW={"md"}
                flex={"1"}
                w={"full"}
                h={"auto"}
            />
        </Stack>
    )
}
