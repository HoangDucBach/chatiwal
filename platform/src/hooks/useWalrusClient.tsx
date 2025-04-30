import { encode } from '@/libs';
import { TMessage } from '@/types';
import { NETWORK } from '@/utils/constants';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { WalrusClient } from '@mysten/walrus';
import { useMemo } from 'react';

interface StoreOptions {
    deletable?: boolean;
    epochs?: number;
}

interface IWalrusClientActions {
    storeMessage: (message: TMessage, options?: StoreOptions) => Promise<TMessage>;
    deleteMessage: (blobId: string) => Promise<void>;
    store(object: any): Promise<string>;
    read(blobIds: string[]): Promise<ArrayBuffer[]>;
    client: WalrusClient;
}

export const useWalrusClient = (): IWalrusClientActions => {
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const walrusClient = new WalrusClient({
        network: NETWORK,
        suiClient,
        storageNodeClientOptions: {
            timeout: 60_000,
        }
    });

    const store = async (object: any, options?: StoreOptions) => {
        const { deletable = true, epochs = 1 } = options || {};
        const encoded = encode(object);
        const encodedBlob = await walrusClient.encodeBlob(encoded);

        if (!currentAccount) {
            throw new Error("Not connected");
        }

        const registerBlobTransaction = await walrusClient.registerBlobTransaction({
            blobId: encodedBlob.blobId,
            rootHash: encodedBlob.rootHash,
            size: encoded.length,
            deletable,
            epochs,
            owner: currentAccount?.address,
        });

        registerBlobTransaction.setSender(currentAccount?.address);
        const { digest } = await signAndExecuteTransaction({ transaction: registerBlobTransaction });

        const { objectChanges, effects } = await suiClient.waitForTransaction({
            digest,
            options: { showObjectChanges: true, showEffects: true },
        });

        if (effects?.status.status !== 'success') {
            throw new Error('Failed to register blob');
        }

        const blobType = await walrusClient.getBlobType();

        const blobObject = objectChanges?.find(
            (change) => change.type === 'created' && change.objectType === blobType,
        );

        if (!blobObject || blobObject.type !== 'created') {
            throw new Error('Blob object not found');
        }

        const confirmations = await walrusClient.writeEncodedBlobToNodes({
            blobId: encodedBlob.blobId,
            metadata: encodedBlob.metadata,
            sliversByNode: encodedBlob.sliversByNode,
            deletable: true,
            objectId: blobObject.objectId,
        });

        const certifyBlobTransaction = await walrusClient.certifyBlobTransaction({
            blobId: encodedBlob.blobId,
            blobObjectId: blobObject.objectId,
            confirmations,
            deletable: true,
        });

        const { digest: certifyDigest } = await signAndExecuteTransaction({
            transaction: certifyBlobTransaction,
        });

        const { effects: certifyEffects } = await suiClient.waitForTransaction({
            digest: certifyDigest,
            options: { showEffects: true },
        });

        if (certifyEffects?.status.status !== 'success') {
            throw new Error('Failed to certify blob');
        }

        return encodedBlob.blobId;
    }

    const storeMessage = async (message: TMessage, options?: StoreOptions) => {
        if (!currentAccount) {
            throw new Error('Not connected');
        }

        const { deletable = true, epochs = 1 } = options || {};

        const messageBlobId = await store(message.content, { deletable, epochs });

        message.blobId = messageBlobId;

        return message;
    }

    const read = async (blobIds: string[]) => {
        const aggregators = ['aggregator1', 'aggregator2', 'aggregator3', 'aggregator4', 'aggregator5', 'aggregator6'];
        const downloadResults = await Promise.all(
            blobIds.map(async (blobId) => {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 10000);
                    const randomAggregator = aggregators[Math.floor(Math.random() * aggregators.length)];
                    const aggregatorUrl = `/${randomAggregator}/v1/blobs/${blobId}`;
                    const response = await fetch(aggregatorUrl, { signal: controller.signal });
                    clearTimeout(timeout);
                    if (!response.ok) {
                        return null;
                    }
                    return await response.arrayBuffer();
                } catch (err) {
                    console.error(`Blob ${blobId} cannot be retrieved from Walrus`, err);
                    return null;
                }
            }),
        );

        return downloadResults.filter((result) => result !== null) as ArrayBuffer[];
    };

    const deleteMessage = async (blobId: string) => {
        if (!currentAccount) {
            throw new Error('Not connected');
        }

        const deleteBlobTransaction = await walrusClient.deleteBlobTransaction({
            blobObjectId: blobId,
            owner: currentAccount?.address,
        });

        const { digest } = await signAndExecuteTransaction({
            transaction: deleteBlobTransaction,
        });

        const { effects } = await suiClient.waitForTransaction({
            digest,
            options: { showEffects: true },
        });

        if (effects?.status.status !== 'success') {
            throw new Error('Failed to delete blob');
        }

    };

    return useMemo(
        () => ({
            store,
            read,
            storeMessage,
            deleteMessage,
            client: walrusClient,
        }),
        [storeMessage, store, read, deleteMessage, walrusClient],
    );
}