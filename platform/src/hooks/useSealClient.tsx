import { useCallback, useMemo } from "react";
import { EncryptedObject, SealClient, SessionKey, getAllowlistedKeyServers } from "@mysten/seal";
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit";
import { fromHex, SUI_CLOCK_OBJECT_ID, toHex } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";

import { useChatiwalClient } from "./useChatiwalClient";
import { useSessionKeys } from "./useSessionKeysStore";
import { MessageType, TMessage } from "@/types";
import { nanoid } from "nanoid";
import { decode, encode } from "@msgpack/msgpack";
import { extractPrefixFromContentId, generateContentId } from "@/libs";


function superMessageSealApprove(packageId: string) {
    return (tx: Transaction, message: TMessage, id: string) => {
        tx.moveCall({
            target: `${packageId}::message::seal_approve_super_message`,
            arguments: [
                tx.pure.vector('u8', fromHex(id)),
                tx.object(message.id),
                tx.object(message.groupId),
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

interface ISealActions {
    encryptMessage: (message: TMessage) => Promise<TMessage>;
    encrypt(auxId: Uint8Array, object: any): Promise<Uint8Array>;
    decrypt: (encryptedObject: Uint8Array, sessionKey: SessionKey) => Promise<Uint8Array>;
    decryptMessage: (encryptedMessage: TMessage, type: MessageType, sessionKey: SessionKey) => Promise<Uint8Array>;
    createSessionKey: () => Promise<SessionKey>;
}

export function useSealClient(): ISealActions {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const { client } = useChatiwalClient();
    const { getSessionKey } = useSessionKeys();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const sealClient = new SealClient({
        suiClient,
        serverObjectIds: getAllowlistedKeyServers("testnet"),
        verifyKeyServers: false,
    });

    const packageId = client.getPackageConfig().chatiwalId;


    const createSessionKey = useCallback(async (): Promise<SessionKey> => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }

        const sessionKey = new SessionKey({
            address: currentAccount.address,
            packageId: packageId,
            ttlMin: 30,
        });

        const signResult = await signPersonalMessage({ message: sessionKey.getPersonalMessage() });
        await sessionKey.setPersonalMessageSignature(signResult.signature);

        return sessionKey;
    }, [currentAccount, packageId, signPersonalMessage]);

    const encryptMessage = useCallback(async (message: TMessage): Promise<TMessage> => {
        const content = message.content;
        const contentAsBytes = new Uint8Array(content);
        const groupObjectBytes = fromHex(message.groupId);
        const moduleMessagePrefix = client.getPackageConfig().moduleMessagePrefix;
        const auxId = Uint8Array.from(message.auxId) || generateContentId(moduleMessagePrefix);
        const id = toHex(auxId);

        const { encryptedObject } = await sealClient.encrypt({
            id,
            packageId,
            threshold: 2,
            data: contentAsBytes,
        });

        message.content = encryptedObject;
        message.auxId = Array.from(auxId);

        return message;
    }, [packageId, sealClient]);

    const encrypt = useCallback(async (auxId: Uint8Array, object: any): Promise<Uint8Array> => {
        const contentAsBytes = new Uint8Array(object);
        const id = toHex(auxId);

        const { encryptedObject } = await sealClient.encrypt({
            id,
            packageId,
            threshold: 2,
            data: contentAsBytes,
        });

        return encryptedObject;
    }, [packageId, sealClient]);

    const decrypt = useCallback(async (encryptedObject: Uint8Array, sessionKey: SessionKey): Promise<Uint8Array> => {
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
            groupSealApprove(packageId)(tx, toHex(extractPrefixFromContentId(fromHex(encryptedObjectParsed.id))), id);
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

    const decryptMessage = useCallback(async (encryptedMessage: TMessage, type: MessageType, sessionKey: SessionKey): Promise<Uint8Array> => {
        if (!currentAccount) {
            throw new Error("Not connected");
        }

        if (!sessionKey) {
            throw new Error("Group key not found, please create a new one");
        }

        if (sessionKey.isExpired()) {
            throw new Error("Session key expired, please create a new one");
        }

        const encryptedData = encryptedMessage.content;
        const encryptedObject = EncryptedObject.parse(new Uint8Array(encryptedData));


        const tx = new Transaction();
        let ids = [encryptedObject.id];

        ids.forEach((id) => {
            if (type === MessageType.BASE) {
                groupSealApprove(packageId)(tx, encryptedMessage.groupId, id);
            } else {
                superMessageSealApprove(packageId)(tx, encryptedMessage, id);
            }
        });

        const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
        await sealClient.fetchKeys({
            ids,
            txBytes,
            sessionKey,
            threshold: 2,
        });

        try {
            const decryptedBytes = await sealClient.decrypt({
                data: new Uint8Array(encryptedData),
                sessionKey,
                txBytes: txBytes,
            });
            return decryptedBytes;
        } catch (e) {
            console.error("Error decrypting message", e);
        }
        return new Uint8Array();
    }, [currentAccount, packageId, sealClient, getSessionKey]);

    return useMemo(() => ({
        encrypt,
        decrypt,
        encryptMessage,
        decryptMessage,
        createSessionKey,
    }), [encryptMessage, decryptMessage]);
}