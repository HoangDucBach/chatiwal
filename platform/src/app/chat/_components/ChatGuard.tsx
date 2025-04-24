"use client"

import { useCurrentAccount } from "@mysten/dapp-kit"
import { NotConnectedDialog } from "./NotConnectedDialog";
import { Box } from "@chakra-ui/react";

interface Props extends React.PropsWithChildren {
}

export default function ChatGuard({ children }: Props) {
    const currentAccount = useCurrentAccount();

    if (!currentAccount) {
        return (
            <>
                <Box
                    position="fixed"
                    width="64"
                    height="64"
                    bg={"primary"}
                    rounded={"full"}
                    filter={"blur(128px)"}
                    left={"50%"}
                    top={"50%"}
                    transform={"translateX(-50%) translateY(-50%)"}
                    pointerEvents={"none"}
                />
                <NotConnectedDialog />
            </>
        )
    }

    return (
        <>
            {children}
        </>
    )
}