import { ChatiwalMessageType, type ChatiwalEncryptedMessage, type ChatiwalMessage, type ChatiwalSuperMessageBase } from "@/types";
import { useChatiwalClient } from "./useChatiwalClient";
import { EncryptedObject, SealClient, SessionKey, getAllowlistedKeyServers } from "@mysten/seal";
import { useCurrentAccount, useSignAndExecuteTransaction, useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit";
import { fromHex, SUI_CLOCK_OBJECT_ID, toHex } from "@mysten/sui/utils";
import { useSessionKeys } from "./useSessionKeys";
import { Transaction } from "@mysten/sui/transactions";
import { SuiObjectResponse } from "@mysten/sui/client";
import { useCallback, useMemo } from "react";


function getSealApproveTarget(packageId: string, messageType: ChatiwalMessageType): string {
    switch (messageType) {
        case ChatiwalMessageType.TIME_LOCK:
            return `${packageId}::message::seal_approve_super_message_time_lock`;
        case ChatiwalMessageType.NO_POLICY:
            return `${packageId}::message::seal_approve_super_message_limited_read`;
        case ChatiwalMessageType.LIMITED_READ:
            return `${packageId}::message::seal_approve_super_message_fee_based`;
        case ChatiwalMessageType.FEE_BASED:
            return `${packageId}::message::seal_approve_super_message_compound`;
        default:
            throw new Error(`Unsupported message type: ${messageType}`);
    }
}

function getSealApproveArguments(
    tx: Transaction,
    messageType: ChatiwalMessageType,
    id: string,
    messageId: string,
    groupId: string
) {
    switch (messageType) {
        case ChatiwalMessageType.TIME_LOCK:
            return [
                tx.pure.vector('u8', fromHex(id)),
                tx.object(messageId),
                tx.object(groupId),
                tx.object(SUI_CLOCK_OBJECT_ID),
            ]
        default:
            return [
                tx.pure.vector('u8', fromHex(id)),
                tx.object(messageId),
                tx.object(groupId),
            ]

    }
}

interface ISealActions {
    encryptMessage: (message: ChatiwalSuperMessageBase) => Promise<ChatiwalEncryptedMessage>;
    decryptMessage: (encryptedMessage: ChatiwalEncryptedMessage) => Promise<ChatiwalMessage>;
}

export function useSealClient(): ISealActions {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { client } = useChatiwalClient();
    const { getGroupKey, setGroupKey } = useSessionKeys();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const sealClient = new SealClient({
        suiClient,
        serverObjectIds: getAllowlistedKeyServers("testnet"),
        verifyKeyServers: false,
    });

    const packageId = client.getPackageConfig().chatiwalId;

    function messageSealApprove(packageId: string, messageType: ChatiwalMessage['type']) {
        return (tx: Transaction, id: string, messageId: string, groupId: string) => {
            tx.moveCall({
                target: getSealApproveTarget(packageId, messageType),
                arguments: getSealApproveArguments(tx, messageType, id, messageId, groupId),
            });
        };
    }

    function groupSealApprove(packageId: string) {
        return (tx: Transaction, id: string, groupId: string) => {
            tx.moveCall({
                target: `${packageId}::group::seal_approve`,
                arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(groupId)],
            });
        };
    }

    // use call back for encryptMessage and decryptMessage
    const encryptMessage = useCallback(async (message: ChatiwalSuperMessageBase): Promise<ChatiwalEncryptedMessage> => {
        const messageAsString = JSON.stringify(message);
        const messageAsUint8Array = new TextEncoder().encode(messageAsString);
        const nonce = crypto.getRandomValues(new Uint8Array(5));
        const groupIdBytes = fromHex(message.groupId);
        const id = toHex(new Uint8Array([...groupIdBytes, ...nonce]));

        const { encryptedObject } = await sealClient.encrypt({
            id,
            packageId,
            threshold: 2,
            data: messageAsUint8Array,
        });


        return {
            id: id,
            groupId: message.groupId,
            type: ChatiwalMessageType.NO_POLICY,
            encryptedData: encryptedObject,
            createdAt: message.createdAt,
        } satisfies ChatiwalEncryptedMessage;
    }, [packageId, sealClient]);

    const decryptMessage = useCallback(async (encryptedMessage: ChatiwalEncryptedMessage): Promise<ChatiwalMessage> => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }


        const sender = currentAccount.address;
        const encryptedObjectBytes = Uint8Array.from(Object.values(encryptedMessage.encryptedData));
        const encryptedObject = EncryptedObject.parse(encryptedObjectBytes);
        const messageId = encryptedMessage.id;
        const groupId = encryptedMessage.groupId;
        const messageType = encryptedMessage.type;

        try {
            let groupKey = getGroupKey(encryptedMessage.groupId);

            if (!groupKey) {
                const newGroupSessionKey = new SessionKey({
                    address: sender,
                    packageId: packageId,
                    ttlMin: 10,
                });
                const signResult = await signPersonalMessage({ message: newGroupSessionKey.getPersonalMessage() });
                await newGroupSessionKey.setPersonalMessageSignature(signResult.signature);
                groupKey = newGroupSessionKey;
                console.log("groupKey", groupKey);
            }


            const tx = new Transaction();
            let ids = [encryptedObject.id];
            ids.forEach((id) => {
                if (messageType === ChatiwalMessageType.NO_POLICY) {
                    groupSealApprove(packageId)(tx, id, groupId);
                } else {
                    messageSealApprove(packageId, messageType)(tx, id, messageId, groupId);
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
                data: encryptedObjectBytes,
                sessionKey: groupKey,
                txBytes: txBytes,
            });

            setGroupKey(encryptedMessage.groupId, groupKey);

            const decryptedContentAsString = new TextDecoder().decode(decryptedBytes);
            const decryptedContent: ChatiwalMessage = JSON.parse(decryptedContentAsString);

            return decryptedContent;

        } catch (error) {
            throw error;
        }
    }, [currentAccount, packageId, sealClient, getGroupKey, setGroupKey]);

    return useMemo(() => ({
        encryptMessage,
        decryptMessage
    }), [encryptMessage, decryptMessage]);
}