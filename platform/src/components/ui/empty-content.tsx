"use client";

import { Box, Center, CenterProps, Icon, StackProps, Text, VStack } from "@chakra-ui/react";
import { FaBoxOpen } from "react-icons/fa";

interface Props extends CenterProps {
    emptyIcon?: React.ReactNode,
    emptyText?: React.ReactNode,
}
export default function EmptyContent({ emptyIcon, emptyText, ...rest }: Props) {
    return (
        <Center flexDirection={"column"} w={"full"} h={"full"} {...rest}>
            <Box rounded={"lg"} bg={"bg.200"} p={"2"} w={"fit"} aspectRatio={"square"} shadow={"custom.md"}>
                <Center>
                    <Icon color={"fg.700"} size={"md"}>
                        {emptyIcon || <FaBoxOpen size={20} />}
                    </Icon>
                </Center>
            </Box>
            <Text color={"fg.700"}>{emptyText}</Text>
        </Center>
    );
}

