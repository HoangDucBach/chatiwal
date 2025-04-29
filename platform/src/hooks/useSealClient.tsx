import { useCallback, useMemo } from "react";
import { EncryptedObject, SealClient, SessionKey, getAllowlistedKeyServers } from "@mysten/seal";
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit";
import { fromHex, SUI_CLOCK_OBJECT_ID, toHex } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";

import { MessageBase, MessageType, SuperMessageNoPolicy } from "@/sdk";
import { useChatiwalClient } from "./useChatiwalClient";
import { useSessionKeys } from "./useSessionKeysStore";
import { encode } from "@/libs";

function getSealApproveTarget(packageId: string, message: SuperMessageNoPolicy): string {
    switch (message.getType()) {
        case MessageType.TimeLock:
            return `${packageId}::message::seal_approve_super_message_time_lock`;
        case MessageType.NoPolicy:
            return `${packageId}::message::seal_approve_super_message_limited_read`;
        case MessageType.LimitedRead:
            return `${packageId}::message::seal_approve_super_message_fee_based`;
        case MessageType.FeeBased:
            return `${packageId}::message::seal_approve_super_message_compound`;
        default:
            throw new Error(`Unsupported message type: ${message.getType()}`);
    }
}


function getSealApproveArguments(
    tx: Transaction,
    message: MessageBase,
    id: string
) {
    const groupId = message.getGroupId();

    switch (message.getType()) {
        case MessageType.TimeLock:
            return [
                tx.pure.vector('u8', fromHex(id)),
                tx.object(id),
                tx.object(id),
                tx.object(SUI_CLOCK_OBJECT_ID),
            ]
        default:
            return [
                tx.pure.vector('u8', fromHex(id)),
                tx.object(id),
                tx.object(groupId),
            ]

    }
}

interface ISealActions {
    encryptMessage: (message: MessageBase) => Promise<MessageBase>;
    decryptMessage: (encryptedMessage: MessageBase, sessionKey: SessionKey) => Promise<MessageBase>;
    createGroupSessionKey: (groupId: string) => Promise<SessionKey>;
    createMessageSessionKey: (messageId: string) => Promise<SessionKey>;
}

export function useSealClient(): ISealActions {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { client } = useChatiwalClient();
    const { getGroupKey } = useSessionKeys();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const sealClient = new SealClient({
        suiClient,
        serverObjectIds: getAllowlistedKeyServers("testnet"),
        verifyKeyServers: false,
    });

    const packageId = client.getPackageConfig().chatiwalId;

    function messageSealApprove(packageId: string) {
        return (tx: Transaction, message: MessageBase, id: string) => {
            tx.moveCall({
                target: getSealApproveTarget(packageId, message),
                arguments: getSealApproveArguments(tx, message, id),
            });
        };
    }

    function groupSealApprove(packageId: string) {
        return (tx: Transaction, message: MessageBase, id: string) => {
            const groupId = message.getGroupId();

            tx.moveCall({
                target: `${packageId}::group::seal_approve`,
                arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(groupId)],
            });
        };
    }

    const createGroupSessionKey = useCallback(async (groupId: string): Promise<SessionKey> => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }

        const sender = currentAccount.address;
        const groupKey = new SessionKey({
            address: sender,
            packageId: packageId,
            ttlMin: 10,
        });

        const signResult = await signPersonalMessage({ message: groupKey.getPersonalMessage() });
        await groupKey.setPersonalMessageSignature(signResult.signature);

        return groupKey;
    }, [currentAccount, packageId, signPersonalMessage]);

    const createMessageSessionKey = useCallback(async (messageId: string): Promise<SessionKey> => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }

        const sender = currentAccount.address;
        const messageKey = new SessionKey({
            address: sender,
            packageId: packageId,
            ttlMin: 10,
        });

        const signResult = await signPersonalMessage({ message: messageKey.getPersonalMessage() });
        await messageKey.setPersonalMessageSignature(signResult.signature);

        return messageKey;
    }, [currentAccount, packageId, signPersonalMessage]);

    const encryptMessage = useCallback(async (message: MessageBase): Promise<MessageBase> => {
        const content = message.getData().content;
        const contentAsBytes = new Uint8Array(content);
        const groupObjectBytes = fromHex(message.getGroupId());
        const id = toHex(new Uint8Array([...groupObjectBytes, ...contentAsBytes]));

        const { encryptedObject } = await sealClient.encrypt({
            id,
            packageId,
            threshold: 2,
            data: contentAsBytes,
        });

        return message.setContent(encryptedObject);

    }, [packageId, sealClient]);

    const decryptMessage = useCallback(async (encryptedMessage: MessageBase, sessionKey: SessionKey): Promise<MessageBase> => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }
        try {
            const encryptedData = encryptedMessage.getData();
            const contentAsBytes = encryptedData.content;
            const encryptedObject = EncryptedObject.parse(new Uint8Array(contentAsBytes));
            const messageType = encryptedMessage.getType();
            let groupKey = sessionKey;

            if (!groupKey) {
                throw new Error("Group key not found, please create a new one");
            }

            if (groupKey.isExpired()) {
                throw new Error("Session key expired, please create a new one");
            }

            const tx = new Transaction();
            let ids = [encryptedObject.id];
            ids.forEach((id) => {
                if (messageType === MessageType.NoPolicy) {
                    groupSealApprove(packageId)(tx, encryptedMessage, id);
                } else {
                    messageSealApprove(packageId)(tx, encryptedMessage, id);
                }
            });
            const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
            await sealClient.fetchKeys({
                ids: ids,
                txBytes,
                sessionKey: groupKey,
                threshold: 2,
            });

            const decryptedBytes = await sealClient.decrypt({
                data: contentAsBytes,
                sessionKey: groupKey,
                txBytes: txBytes,
            });


            const decryptedContentAsString = new TextDecoder().decode(decryptedBytes);
            const decryptedContent = JSON.parse(decryptedContentAsString);
            const decryptedMessage = encryptedMessage.setData({
                content: decryptedContent,
            });

            return decryptedMessage;
        } catch (error) {
            console.error("Error decrypting message:", error);
            throw new Error("Failed to decrypt message, please try again.");
        }
    }, [currentAccount, packageId, sealClient, getGroupKey]);

    return useMemo(() => ({
        encryptMessage,
        decryptMessage,
        createGroupSessionKey,
        createMessageSessionKey,
    }), [encryptMessage, decryptMessage]);
}