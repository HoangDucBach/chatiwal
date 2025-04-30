"use client"

import { Box, Center, DialogFooter, DialogHeader, DialogRootProps, Icon, Text, VStack } from "@chakra-ui/react";
import { DialogBody, DialogContent, DialogRoot, DialogTrigger } from "@/components/ui/dialog";
import { ConnectButton } from "@/components/global/wallet";
import { TbPlugConnected } from "react-icons/tb";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface Props {
}
export function NotConnectedDialog({
    ...props
}: Props) {
    const currentAccount = useCurrentAccount();

    return (
        <DialogRoot
            open={!currentAccount}
            size={"xs"}
            placement={"center"}
        >
            <DialogContent outlineWidth={"8px"} maxW={"xs"} outlineColor={"bg.200"} rounded={"4xl"} shadow={"custom.lg"} {...props}>
                <DialogHeader>
                    <Box
                        position="absolute"
                        width="16"
                        height="16"
                        bg={"primary"}
                        rounded={"full"}
                        filter={"blur(64px)"}
                        left={"50%"}
                        zIndex={"-1"}
                        transform={"translateX(-50%) translateY(-50%)"}
                        pointerEvents={"none"}
                    />
                    <Center w={"full"} flexDirection={"column"} gap={"4"}>
                        <Box
                            width="12"
                            height="1.5"
                            rounded={"full"}
                            bg={"white/15"}
                        />
                        <Box bg={"fg.50"} p={"2"} rounded={"2xl"} shadow={"custom.sm"}>
                            <Icon color={"primary"} w={"8"} h={"8"}>
                                <TbPlugConnected />
                            </Icon>
                        </Box>
                    </Center>
                </DialogHeader>
                <DialogBody>
                    <VStack justify={"center"} w={"full"} zIndex={"0"}>
                        <Text fontWeight={"semibold"} fontSize={"2xl"}>Not Connected</Text>
                        <Text color={"fg.800"}>Please connect to wallet!</Text>
                    </VStack>
                </DialogBody>
                <DialogFooter justifyContent={"center"}>
                    <ConnectButton size={"sm"} />
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    )
}