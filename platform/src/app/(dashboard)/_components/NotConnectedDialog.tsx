"use client"

import { Center, DialogHeader, DialogRootProps, Icon, Text, VStack } from "@chakra-ui/react";
import { DialogBody, DialogContent, DialogRoot, DialogTrigger } from "@/components/ui/dialog";
import { ConnectButton } from "@/components/global/wallet";
import { TbPlugConnected } from "react-icons/tb";

interface Props {
    open?: boolean;
    onOpenChange?: (details: any) => void;
}
export function NotConnectedDialog({
    open,
    ...props
}: Props) {
    return (
        <DialogRoot
            open={open}
            onOpenChange={props.onOpenChange}
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