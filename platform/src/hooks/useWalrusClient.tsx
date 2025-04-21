import { ChatiwalMessage } from '@/types';
import { WalrusClient } from '@mysten/walrus';

interface WalrusClientActions{
    storeMessage: (message: ChatiwalMessage) => Promise<void>;
    readMessage: (blobId: string) => Promise<ChatiwalMessage>;
}