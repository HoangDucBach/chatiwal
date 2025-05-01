"use client"

import { Center, CenterProps, HStack, Icon, IconProps, Spinner, Stack, Text, VStack } from "@chakra-ui/react";

interface Props extends CenterProps {
    loading?: boolean;
    loadingIconProps?: IconProps & {
        loadingIcon?: React.ReactNode;
    };
    loadingContentProps?: {
        loadingTitle?: string;
        loadingDescription?: string;
    }
}
export function LoadingContent({ loadingIconProps, loadingContentProps, ...props }: Props) {
    return (
        <Center
            flexDirection={"column"}
            pos={"relative"}
            flex={"1"}
            w={"full"}
            h={"full"}
            {...props}
        >
            {
                loadingIconProps?.loadingIcon && (
                    <Icon colorPalette={"primary"} {...loadingIconProps}>
                        {loadingIconProps?.loadingIcon}
                    </Icon>
                )
            }

            <VStack>
                <HStack>
                    <Text fontWeight={"medium"}>
                        {loadingContentProps?.loadingTitle || "Loading"}
                    </Text>
                    <Spinner />
                </HStack>
                <Text maxW={"75%"} textAlign={"center"} fontSize={"sm"} color={"fg.contrast"}>
                    {loadingContentProps?.loadingDescription || "Please wait a moment"}
                </Text>
            </VStack>
        </Center>
    )
}