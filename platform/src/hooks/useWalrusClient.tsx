import { MessageBase } from '@/sdk';
import { NETWORK } from '@/utils/constants';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { WalrusClient } from '@mysten/walrus';

interface StoreMessageOptions {
    deletable?: boolean;
    epochs?: number;
}

interface IWalrusClientActions {
    storeMessage: (message: MessageBase, options?: StoreMessageOptions) => Promise<MessageBase>;
    readMessage: (blobId: string) => Promise<any>;
    deleteMessage: (blobId: string) => Promise<void>;
}

export const useWalrusClient = (): IWalrusClientActions => {
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const walrusClient = new WalrusClient({
        network: NETWORK,
        suiClient,
    });

    const storeMessage = async (message: MessageBase, options?: StoreMessageOptions) => {
        if (!currentAccount) {
            throw new Error('Not connected');
        }

        const { deletable = true, epochs = 1 } = options || {};
        const encodedMessage = new TextEncoder().encode(JSON.stringify(message.getData().content));
        const encodedBlob = await walrusClient.encodeBlob(encodedMessage);

        const registerBlobTransaction = await walrusClient.registerBlobTransaction({
            blobId: encodedBlob.blobId,
            rootHash: encodedBlob.rootHash,
            size: encodedMessage.length,
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

        return message;
    }

    const readMessage = async (blobId: string) => {
        const blob = await walrusClient.readBlob({
            blobId,
        });

        if (!blob) {
            throw new Error('Blob not found');
        }
        const decodedMessage = new TextDecoder().decode(blob);

        return JSON.parse(decodedMessage) as any;
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
    return { storeMessage, readMessage, deleteMessage };
}