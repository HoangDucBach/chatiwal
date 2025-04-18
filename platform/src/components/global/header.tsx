"use client"

import { chakra } from "@chakra-ui/react";
import { ConnectButton } from "./wallet";

interface Props { }

export function Header({ }: Props) {
    return (
        <chakra.div>
            <ConnectButton />
        </chakra.div>
    )
}