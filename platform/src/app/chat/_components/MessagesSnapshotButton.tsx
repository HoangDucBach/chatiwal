"use client";
import { ButtonProps, Icon } from "@chakra-ui/react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useMutation } from "@tanstack/react-query";
import { encode } from "@msgpack/msgpack";
import { TbScreenshot } from "react-icons/tb";

import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { TMessage } from "@/types";
import { useGroup } from "../_hooks/useGroup";
import { toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { useMessageStore } from "../_hooks/useMessagesStore";
import { useChannelName } from "../_hooks/useChannelName";
import { Transaction } from "@mysten/sui/transactions";
interface Props extends ButtonProps { }

export function MessagesSnapshotButton({ ...props }: Props) {
    const { group } = useGroup();
    const { mintMessagesSnapshotAndTransfer } = useChatiwalClient();
    const { storeReturnTransaction } = useWalrusClient();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const currentAccount = useCurrentAccount();
    const { channelName } = useChannelName();
    const { getMessages } = useMessageStore();
    const messages = getMessages(channelName);

    const { mutate: snap, isPending } = useMutation({
        mutationKey: ["mint::messages::snapshot", currentAccount?.address],
        mutationFn: async () => {
            if (!currentAccount) throw new Error("Not connected");
            if (!messages) throw new Error("No messages to snapshot");

            const { blobId, transaction } = await storeReturnTransaction(messages);
            const tx = await mintMessagesSnapshotAndTransfer(group.id, blobId, { tx: transaction });

            await signAndExecuteTransaction({ transaction: tx })
        },
        onSuccess: () => {
            toaster.success({
                title: "Snapshot created",
                description: "The snapshot of messages has been successfully created.",
            });
        },
        onError: (error) => {
            console.error("Snapshot error:", error);
            if (error.message === "No messages to snapshot") {
                toaster.warning({
                    title: "Empty snapshot",
                    description: "No messages to snapshot.",
                });
                return;
            }
            toaster.error({
                title: "Snapshot failed",
                description: error.message,
            });
        },
    })

    return (
        <Button
            size={"sm"}
            p={"1"}
            variant={"outline"}
            colorPalette={"default"}
            loading={isPending}
            loadingText="Snapshoting..."
            disabled={isPending}
            onClick={() => snap()} {...props}
        >
            <Icon as={TbScreenshot} />
        </Button>
    )
}