"use client"

import { Menu, chakra, Portal } from "@chakra-ui/react"
import { ConnectModal, useAutoConnectWallet, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { Button, ButtonProps } from "../ui/button";
import { shortenAddress } from "@/libs";
import { Icon } from "@chakra-ui/react"
import { TbLogout } from "react-icons/tb";
import { useEffect } from "react";

interface Props extends ButtonProps { }
export function ConnectButton(props: Props) {
    const account = useCurrentAccount();
    const { mutate: disconnect } = useDisconnectWallet();

    return (
        <ConnectModal
            trigger={
                account ? <Button colorPalette={"danger"} size="sm" onClick={() => { disconnect() }} {...props}>Disconnect</Button> : <Button colorPalette={"primary"} size="sm" {...props}>Connect</Button>
            }
        />
    )
}

function MenuAccount() {
    const account = useCurrentAccount();
    const { mutate: disconnect } = useDisconnectWallet();

    if (!account) return null;

    return (
        <Menu.Root>
            <Menu.Trigger asChild>
                <Button variant="outline" colorPalette={"primary"} size="sm">
                    {shortenAddress(account.address)}
                </Button>
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content rounded={"2xl"} bg={"primary.100"}>
                        <Menu.Item
                            value="disconnect"
                            bg={"primary.contrast"}
                            _hover={{
                                bg: "primary.emphasized",
                            }}
                            onClick={() => disconnect()} rounded={"lg"}
                        >
                            <Icon boxSize={4} >
                                <TbLogout />
                            </Icon>
                            Disconnect
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    )
}