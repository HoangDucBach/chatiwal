import { useChatiwalClient } from "@/hooks/useChatiwalClient";
import { useWalrusClient } from "@/hooks/useWalrusClient";
import { getMessagePolicyType, MessageType, TMessage } from "@/types";
import { StackProps } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useGroup } from "../_hooks/useGroupId";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { decode } from "@msgpack/msgpack";
import { MessageBase, SuperMessagePolicy } from "./messages";
import { useEffect } from "react";
import { LoadingContent } from "@/components/ui/loading-content";
import { ChatiwalMascotIcon } from "@/components/global/icons";

interface Props extends StackProps {
    onSuccess?: (messages: TMessage[]) => void;
}
export function ChatHistoryBySnapshot({ onSuccess, ...props }: Props) {
    const { read } = useWalrusClient();
    const { client, getMessageSnapshotData } = useChatiwalClient();
    const { group } = useGroup();
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { data: messages, error, isLoading } = useQuery({
        queryKey: ["messages::history", group.id, currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount) throw new Error("Not connected");

            const res = await suiClient.getOwnedObjects({
                owner: currentAccount?.address,
                filter: {
                    StructType: `${client.getPackageConfig().chatiwalId}::message::MessagesSnapshot`,
                }
            })

            let lastestSnapshot = res.data?.[0];

            for (const snapshot of res.data) {
                if (Number(snapshot.data?.version) > Number(lastestSnapshot.data?.version)) {
                    lastestSnapshot = snapshot;
                }
            }

            if (!lastestSnapshot || !lastestSnapshot.data) {
                return [];
            }

            const snapShot = await getMessageSnapshotData(lastestSnapshot.data?.objectId);
            const bufferArr = await read([snapShot.messages_blob_id]);
            console.log("bufferArr", bufferArr);
            if (!bufferArr) {
                return [];
            }

            const messages = decode(decode(bufferArr[0]) as Uint8Array) as TMessage[];

            onSuccess && onSuccess(messages);
            return messages;
        },
        enabled: !!group.id && !!currentAccount,
        staleTime: Infinity,
    })

    useEffect(() => {
        if (error) {
            console.log(error);
        }
    }, [error]);

    if (isLoading) {
        return (
            <LoadingContent
                loadingIconProps={{
                    loadingIcon: <ChatiwalMascotIcon />,
                }}
                loadingContentProps={{
                    loadingTitle: "Loading group history",
                    loadingDescription: "Getting history from your snapshot messages of this group",
                }}
            />
        )
    }

    if (!messages) {
        return null;
    }

    return (
        <>
            {messages.map((message) => (
                getMessagePolicyType(message) === MessageType.BASE ? (
                    <MessageBase
                        key={message.id}
                        message={message}
                        self={message.owner === currentAccount?.address}
                    />
                ) : (
                    <SuperMessagePolicy
                        key={message.id}
                        messageId={message.id}
                    />
                )
            ))}
        </>
    )
}