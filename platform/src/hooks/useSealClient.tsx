import { useCallback, useMemo } from "react";
import { EncryptedObject, SealClient, SessionKey, getAllowlistedKeyServers } from "@mysten/seal";
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit";
import { fromHex, SUI_CLOCK_OBJECT_ID, toHex } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";

import { useChatiwalClient } from "./useChatiwalClient";
import { MessageType } from "@/types";
import { extractPrefixFromContentId } from "@/libs";


function superMessageSealApprove(packageId: string) {
    return (tx: Transaction, id: string, msgId: string, groupId: string) => {
        tx.moveCall({
            target: `${packageId}::message::seal_approve_super_message`,
            arguments: [
                tx.pure.vector('u8', fromHex(id)),
                tx.object(msgId),
                tx.object(groupId),
                tx.object(SUI_CLOCK_OBJECT_ID),
            ],
        });
    };
}

function groupSealApprove(packageId: string) {
    return (tx: Transaction, groupId: string, id: string) => {
        tx.moveCall({
            target: `${packageId}::group::seal_approve`,
            arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(groupId)],
        });
    };
}

function directSealApprove(packageId: string) {
    return (tx: Transaction, id: string) => {
        tx.moveCall({
            target: `${packageId}::group::seal_approve_for_direct`,
            arguments: [tx.pure.vector('u8', fromHex(id))],
        });
    };
}

interface Options {
    type?: MessageType;
    groupId?: string;
    msgId?: string
}

interface ISealActions {
    // encryptMessage: (message: TMessage, options?: Options) => Promise<TMessage>;
    encrypt(id: Uint8Array, object: any, options?: Options): Promise<Uint8Array>;
    decrypt: (encryptedObject: Uint8Array, sessionKey: SessionKey, options?: Options) => Promise<Uint8Array>;
    // decryptMessage: (encryptedMessage: TMessage, type: MessageType, sessionKey: SessionKey, options?: Options) => Promise<Uint8Array>;
    createSessionKey: () => Promise<SessionKey>;
}

export function useSealClient(): ISealActions {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { client } = useChatiwalClient();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const sealClient = new SealClient({
        suiClient,
        serverConfigs: getAllowlistedKeyServers('testnet').map((id) => ({
            objectId: id,
            weight: 1,
        })),
        verifyKeyServers: false,
    });

    const packageId = client.getPackageConfig().chatiwalId;


    const createSessionKey = useCallback(async (): Promise<SessionKey> => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }

        const sessionKey = await SessionKey.create({
            address: currentAccount.address,
            packageId: packageId,
            ttlMin: 30,
            suiClient,
        });

        const signResult = await signPersonalMessage({ message: sessionKey.getPersonalMessage() });
        await sessionKey.setPersonalMessageSignature(signResult.signature);

        return sessionKey;
    }, [currentAccount, packageId, signPersonalMessage]);


    const encrypt = useCallback(async (id: Uint8Array, object: any, options?: Options): Promise<Uint8Array> => {
        const contentAsBytes = new Uint8Array(object);

        const { encryptedObject } = await sealClient.encrypt({
            id: toHex(id),
            packageId,
            threshold: 2,
            data: contentAsBytes,
        });

        return encryptedObject;
    }, [packageId, sealClient]);

    const decrypt = useCallback(async (encryptedObject: Uint8Array, sessionKey: SessionKey, options?: Options): Promise<Uint8Array> => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }

        if (!sessionKey) {
            throw new Error("Group key not found, please create a new one");
        }

        if (sessionKey.isExpired()) {
            throw new Error("Session key expired, please create a new one");
        }

        const tx = new Transaction();
        const encryptedObjectParsed = EncryptedObject.parse(new Uint8Array(encryptedObject));
        const ids = [encryptedObjectParsed.id];
        
        ids.forEach((id) => {
            switch (options?.type) {
                case MessageType.GROUP:
                    groupSealApprove(packageId)(tx, toHex(extractPrefixFromContentId(fromHex(encryptedObjectParsed.id))), id);
                    break;
                case MessageType.DIRECT:
                    directSealApprove(packageId)(tx, id);
                    break;
                case MessageType.SUPER_MESSAGE:
                    if (!options?.groupId) {
                        throw new Error("Message ID and group ID are required for super message decryption");
                    }
                    if (!options?.msgId) {
                        throw new Error("Message ID is required for super message decryption");
                    }
                    superMessageSealApprove(packageId)(tx, id, options.msgId, options.groupId);
                    break;
                default:
                    groupSealApprove(packageId)(tx, toHex(extractPrefixFromContentId(fromHex(encryptedObjectParsed.id))), id);
                    break;
            }
        });

        const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
        await sealClient.fetchKeys({
            ids,
            txBytes,
            sessionKey,
            threshold: 2,
        });

        const decryptedBytes = await sealClient.decrypt({
            data: new Uint8Array(encryptedObject),
            sessionKey,
            txBytes,
        });

        return decryptedBytes;
    }, [currentAccount, packageId, sealClient, suiClient]);


    return useMemo(() => ({
        encrypt,
        decrypt,
        createSessionKey,
    }), [encrypt, decrypt, createSessionKey]);
}