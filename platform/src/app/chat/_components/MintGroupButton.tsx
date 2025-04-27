"use client"

import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useSupabase } from "@/hooks/useSupabase";
import { ButtonProps, Icon } from "@chakra-ui/react";
import { useSuiClient, useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { useMutation } from "@tanstack/react-query";
import { IoIosAdd } from "react-icons/io";

interface Props extends ButtonProps {
    onSuccess?: (groupId: string) => void;
    onError?: (error: any) => void;
}
export function MintGroupButton({ onSuccess, onError, ...props }: Props) {
    const { mintGroupAndTransfer, client } = useChatiwalClient();
    const { addGroupMembership } = useSupabase();
    const suiClient = useSuiClient();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
    const currentAccount = useCurrentAccount();
    const { mutate: mint, isPending } = useMutation({
        mutationKey: ["groups::mint"],
        mutationFn: async () => {
            if (!currentAccount) throw new Error("Not connected");

            const tx = await mintGroupAndTransfer();
            const { digest } = await signAndExecuteTransaction({
                transaction: tx,
            })
            const { events } = await suiClient.waitForTransaction({
                digest,
                options: {
                    showEvents: true,
                }
            })

            const groupMintedEventType = `${client.getPackageConfig().chatiwalId}::events::GroupMinted`;
            const groupMintedEvent = events?.find(event => event.type === groupMintedEventType);

            if (!groupMintedEvent || !groupMintedEvent.parsedJson) throw new Error("GroupMinted event not found");

            const newGroupData = groupMintedEvent.parsedJson as { id: string };
            onSuccess?.(newGroupData.id);
            await addGroupMembership(currentAccount?.address!, newGroupData.id);
            return newGroupData.id;

        },
        onSuccess: async (groupId: string) => {
            toaster.success({
                title: "Group created",
                description: "Group created successfully",
            });
        },
        onError: (error: any) => {
            onError?.(error);
            toaster.error({
                title: "Error creating group",
                description: error,
            })
        }

    })

    return (
        <Button
            colorPalette={"primary"}
            w={"full"}
            onClick={() => mint()}
            loading={isPending}
            loadingText={"Minting..."}
            disabled={isPending}
            {...props}
        >
            <Icon>
                <IoIosAdd />
            </Icon>
            Mint group
        </Button>
    )
}