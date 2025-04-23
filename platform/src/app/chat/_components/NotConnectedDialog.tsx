"use client"

import { Center, DialogHeader, DialogRootProps, Icon, Text, VStack } from "@chakra-ui/react";
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
    if(currentAccount) return null;
    
    return (
        <DialogRoot
            open={!currentAccount}
            size={"xs"}
            placement={"center"}
        >
            <DialogContent>
                <DialogHeader>
                    <Center w={"full"}>
                        <Icon color={"primary"} w={"16"} h={"16"}>
                            <TbPlugConnected />
                        </Icon>
                    </Center>
                </DialogHeader>
                <DialogBody>
                    <VStack justify={"center"} w={"full"} zIndex={"0"}>
                        <Text fontWeight={"semibold"} fontSize={"2xl"}>Not Connected</Text>
                        <Text color={"fg.800"}>Please connect to wallet!</Text>
                    </VStack>
                </DialogBody>
                <DialogHeader>
                    <ConnectButton w={"full"} />
                </DialogHeader>
            </DialogContent>
        </DialogRoot>
    )
}