import { ChatiwalMessageType, type ChatiwalEncryptedMessage, type ChatiwalMessage, type ChatiwalMessageBase } from "@/types";
import { useChatiwalClient } from "./useChatiwalClient";
import { EncryptedObject, SealClient, SessionKey, getAllowlistedKeyServers } from "@mysten/seal";
import { useCurrentAccount, useSignAndExecuteTransaction, useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit";
import { fromHex, toHex } from "@mysten/sui/utils";
import { useSessionKeys } from "./useSessionKeys";
import { Transaction } from "@mysten/sui/transactions";
import { SuiObjectResponse } from "@mysten/sui/client";


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

interface ISealActions {
    encryptMessage: (message: ChatiwalMessageBase) => Promise<ChatiwalEncryptedMessage>;
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
                arguments: [
                    tx.pure.vector('u8', fromHex(id)),
                    tx.object(messageId),
                    tx.object(groupId),
                ],
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

    const encryptMessage = async (message: ChatiwalMessageBase): Promise<ChatiwalEncryptedMessage> => {
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
    };

    const decryptMessage = async (encryptedMessage: ChatiwalEncryptedMessage): Promise<ChatiwalMessage> => {
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
    };

    // const encryptMessage = async (message: ChatiwalMessage): Promise<ChatiwalEncryptedMessage> => {
    //     // Implement encryption logic here
    //     const messageAsString = JSON.stringify(message);
    //     console.log("Encrypting message 1", message);
    //     const messageAsUint8Array = new TextEncoder().encode(messageAsString);
    //     const nonce = crypto.getRandomValues(new Uint8Array(5));

    //     const { encryptedObject } = await sealClient.encrypt({
    //         id: message.groupId,
    //         packageId: client.getPackageConfig().chatiwalId,
    //         threshold: 2,
    //         data: messageAsUint8Array,
    //     });

    //     return {
    //         id: message.id,
    //         groupId: message.groupId,
    //         encryptedData: encryptedObject,
    //         createdAt: message.createdAt,
    //         type: message.type,
    //     } satisfies ChatiwalEncryptedMessage;
    // };

    // const decryptMessage = async (message: ChatiwalEncryptedMessage): Promise<ChatiwalMessage> => {
    //     if (!currentAccount) {
    //         throw new Error("Not connected");
    //     }
    //     let object = Uint8Array.from(Object.values(message.encryptedData));
    //     console.log("Decrypting message", message);
    //     console.log("Encrypted data:", object);
    //     console.log("Encrypted data type:", typeof object);
    //     console.log("Encrypted data length:", object.byteLength);
    //     const encryptedObject = EncryptedObject.parse(object);
    //     console.log("Encrypted object 123:", encryptedObject);
    //     const groupId = message.groupId;

    //     let groupKey = getGroupKey(groupId);
    //     // if (groupKey) {
    //     //     const tx = new Transaction();
    //     //     const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
    //     //     let ids = [encryptedObject.id];
    //     //     ids.forEach((id) => constructMoveCall(client.getPackageConfig().chatiwalId)(tx, id));
    //     //     await sealClient.fetchKeys({
    //     //         ids,
    //     //         txBytes,
    //     //         sessionKey: groupKey,
    //     //         threshold: 2
    //     //     });
    //     //     const decryptedMessage = await sealClient.decrypt({
    //     //         data: message.encryptedData,
    //     //         sessionKey: groupKey,
    //     //         txBytes: txBytes,
    //     //     });
    //     //     console.log("Decrypted ss:", decryptedMessage);
    //     //     const decryptedMessageAsString = new TextDecoder().decode(decryptedMessage);
    //     //     return JSON.parse(decryptedMessageAsString);
    //     // }

    //     let res: ChatiwalMessage | undefined;
    //     const newGroupSessionKey = new SessionKey({
    //         address: currentAccount?.address,
    //         packageId: client.getPackageConfig().chatiwalId,
    //         ttlMin: 10,
    //     });
    //     try {
    //         if (!groupKey) {
    //             const result = await signPersonalMessage({ message: newGroupSessionKey.getPersonalMessage() });
    //             await newGroupSessionKey.setPersonalMessageSignature(result.signature);
    //             groupKey = newGroupSessionKey;
    //             setGroupKey(groupId, groupKey);
    //         }
    //         const tx = new Transaction();
    //         let ids = [encryptedObject.id];
    //         ids.forEach((id) => groupSealApprove(client.getPackageConfig().chatiwalId)(tx, message.id, groupId));
    //         const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
    //         await sealClient.fetchKeys({
    //             ids,
    //             txBytes,
    //             sessionKey: groupKey,
    //             threshold: 2
    //         });
    //         console.log("Key servers", getAllowlistedKeyServers("testnet"));
    //         const decryptedMessage = await sealClient.decrypt({
    //             data: object,
    //             sessionKey: groupKey,
    //             txBytes: txBytes,
    //         });

    //         let decryptedMessageAsString = new TextDecoder().decode(decryptedMessage);
    //         console.log("Decrypted message as string:", decryptedMessageAsString);
    //         res = JSON.parse(decryptedMessageAsString) satisfies ChatiwalMessage;
    //         // console.log("Decrypted message:", decryptedMessage);

    //     }
    //     catch (error) {
    //         console.error("Error decrypting message:", error);
    //         throw error;
    //     }

    //     if (!res) {
    //         throw new Error("Failed to decrypt message");
    //     }
    //     return res;
    // };

    return {
        encryptMessage,
        decryptMessage,
    };
}