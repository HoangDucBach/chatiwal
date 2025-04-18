"use client"

import { Menu, chakra, Portal } from "@chakra-ui/react"
import { ConnectModal, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { Button } from "../ui/button";
import { shortenAddress } from "@/libs";
import { Icon } from "@chakra-ui/react"
import { TbLogout } from "react-icons/tb";

interface Props { }
export function ConnectButton({ }: Props) {
    const account = useCurrentAccount();

    return (
        <chakra.div>
            <ConnectModal
                trigger={
                    account ? <MenuAccount /> : <Button colorPalette={"primary"} size="sm">Connect</Button>
                }
            />
        </chakra.div>
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