import { useCallback, useMemo } from "react";
import { EncryptedObject, SealClient, SessionKey, getAllowlistedKeyServers } from "@mysten/seal";
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit";
import { fromHex, SUI_CLOCK_OBJECT_ID, toHex } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";

import { useChatiwalClient } from "./useChatiwalClient";
import { useSessionKeys } from "./useSessionKeysStore";
import { MessageType, TMessage } from "@/types";

function getSealApproveTarget(packageId: string, type: MessageType) {
    switch (type) {
        case MessageType.TIME_LOCK:
            return `${packageId}::message::seal_approve_super_message_time_lock`;
        case MessageType.LIMITED_READ:
            return `${packageId}::message::seal_approve_super_message_limited_read`;
        case MessageType.FEE_BASED:
            return `${packageId}::message::seal_approve_super_message_fee_based`;
        case MessageType.COMPOUND:
            return `${packageId}::message::seal_approve_super_message_compound`;
        default:
            return `${packageId}::group::seal_approve`;
    }
}


function getSealApproveArguments(
    tx: Transaction,
    message: TMessage,
    type: MessageType,
    id: string
) {
    const groupId = message.groupId;

    switch (type) {
        case MessageType.TIME_LOCK:
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

function messageSealApprove(packageId: string) {
    return (tx: Transaction, message: TMessage, type: MessageType, id: string) => {
        tx.moveCall({
            target: getSealApproveTarget(packageId, type),
            arguments: getSealApproveArguments(tx, message, type, id),
        });
    };
}

function groupSealApprove(packageId: string) {
    return (tx: Transaction, message: TMessage, id: string) => {
        const groupId = message.groupId;
        tx.moveCall({
            target: `${packageId}::group::seal_approve`,
            arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(groupId)],
        });
    };
}

interface ISealActions {
    encryptMessage: (message: TMessage) => Promise<TMessage>;
    decryptMessage: (encryptedMessage: TMessage, sessionKey: SessionKey) => Promise<TMessage>;
    createSessionKey: () => Promise<SessionKey>;
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


    const createSessionKey = useCallback(async (groupId: string): Promise<SessionKey> => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }

        const sessionKey = new SessionKey({
            address: currentAccount.address,
            packageId: packageId,
            ttlMin: 10,
        });

        const signResult = await signPersonalMessage({ message: sessionKey.getPersonalMessage() });
        await sessionKey.setPersonalMessageSignature(signResult.signature);

        return sessionKey;
    }, [currentAccount, packageId, signPersonalMessage]);

    const encryptMessage = useCallback(async (message: TMessage): Promise<TMessage> => {
        const content = message.content;
        const contentAsBytes = new Uint8Array(content);
        const groupObjectBytes = fromHex(message.groupId);
        const hashBuffer: ArrayBuffer = await crypto.subtle.digest('SHA-256', contentAsBytes);
        const contentHashBytes = new Uint8Array(hashBuffer);
        const id = toHex(new Uint8Array([...groupObjectBytes, ...contentHashBytes]));

        const { encryptedObject } = await sealClient.encrypt({
            id,
            packageId,
            threshold: 2,
            data: contentAsBytes,
        });
        message.content = encryptedObject;

        return message;
    }, [packageId, sealClient]);

    const decryptMessage = useCallback(async (encryptedMessage: TMessage, type: MessageType, sessionKey: SessionKey): Promise<TMessage> => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }

        if (!sessionKey) {
            throw new Error("Group key not found, please create a new one");
        }

        if (sessionKey.isExpired()) {
            throw new Error("Session key expired, please create a new one");
        }

        try {
            const encryptedData = encryptedMessage.content;
            console.log("Encrypted data", encryptedData);
            const encryptedObject = EncryptedObject.parse(new Uint8Array(encryptedData));


            const tx = new Transaction();
            let ids = [encryptedObject.id];

            ids.forEach((id) => {
                if (type === MessageType.BASE || type === MessageType.NO_POLICY) {
                    groupSealApprove(packageId)(tx, encryptedMessage, id);
                } else {
                    messageSealApprove(packageId)(tx, encryptedMessage, type, id);
                }
            });

            const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
            await sealClient.fetchKeys({
                ids: ids,
                txBytes,
                sessionKey,
                threshold: 2,
            });

            const decryptedBytes = await sealClient.decrypt({
                data: new Uint8Array(encryptedData),
                sessionKey,
                txBytes: txBytes,
            });


            const decryptedMessage = encryptedMessage.setData({
                content: decryptedBytes,
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
        createSessionKey,
    }), [encryptMessage, decryptMessage]);
}