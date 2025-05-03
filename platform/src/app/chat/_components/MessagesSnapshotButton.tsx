"use client";
import { ButtonProps, Icon } from "@chakra-ui/react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useMutation } from "@tanstack/react-query";
import { encode } from "@msgpack/msgpack";
import { TbScreenshot } from "react-icons/tb";

import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { TMessage } from "@/types";
import { useGroup } from "../_hooks/useGroupId";
import { toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
interface Props extends ButtonProps {
    messages?: TMessage[];
}

export function MessagesSnapshotButton({ messages, ...props }: Props) {
    const { group } = useGroup();
    const { mintMessagesSnapshotAndTransfer } = useChatiwalClient();
    const { store } = useWalrusClient();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const currentAccount = useCurrentAccount();
    const { mutate: snap, isPending } = useMutation({
        mutationKey: ["mint::messages::snapshot", messages, currentAccount?.address],
        mutationFn: async () => {
            if (!currentAccount) throw new Error("Not connected");
            if (!messages) throw new Error("No messages to snapshot");

            const blobId = await store(messages);
            const tx = await mintMessagesSnapshotAndTransfer(group.id, blobId);

            await signAndExecuteTransaction({ transaction: tx })
        },
        onSuccess: () => {
            toaster.success({
                title: "Snapshot created",
                description: "The snapshot of messages has been successfully created.",
            });
        },
        onError: (error) => {
            toaster.error({
                title: "Snapshot failed",
                description: error.message,
            });
        },
    })

    return (
        <Button
            variant={"plain"}
            loading={isPending}
            loadingText="Creating snapshot..."
            disabled={!messages || messages.length === 0}
            onClick={() => snap()} {...props}
        >
            <Icon>
                <TbScreenshot />
            </Icon>
            Snapshot
        </Button>
    )
}