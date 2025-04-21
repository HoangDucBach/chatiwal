import { MessageBase } from "@/sdk";

export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    DOCUMENT = 'document',
    GIF = 'gif'
}


export interface MediaContent {
    id: string;
    type: MediaType;
    url: string;
    name?: string;
    size?: number;
    duration?: number;
    dimensions?: {
        width: number;
        height: number;
    };
    mimeType?: string;
}

export enum ChatiwalMessageType {
    NO_POLICY = 'no-policy',
    TIME_LOCK = 'time-lock',
    LIMITED_READ = 'limited-read',
    FEE_BASED = 'fee-based',
    COMPOUND = 'compound'
}

export interface ChatiwalMessageBase {
    id: string;
    type?: ChatiwalMessageType;
    owner: string;
    groupId: string;
    messageBlobId?: string;
    content: {
        text?: string;
        media?: MediaContent[];
    };
    createdAt: Date;
}

// export interface ChatiwalEncryptedMessage extends MessageBase {
//     encryptedData: Uint8Array;
// }

// === Onchain Types ===

export interface MessageNoPolicy extends ChatiwalMessageBase {
    type: ChatiwalMessageType.NO_POLICY;
}

export interface MessageTimeLock extends ChatiwalMessageBase {
    type: ChatiwalMessageType.TIME_LOCK;
    policy: {
        from: number;
        to: number;
    };
}

export interface MessageLimitedRead extends ChatiwalMessageBase {
    type: ChatiwalMessageType.LIMITED_READ;
    policy: {
        maxReads: number;
    };
    readers: string[];
}

export interface MessageFeeBased<CoinType> extends ChatiwalMessageBase {
    type: ChatiwalMessageType.FEE_BASED;
    policy: {
        fee: number;
        recipient: string;
    };
    readers: string[];
    feeCollected: number;
    coinType: CoinType;
}

export interface ChatiwalMessageCompound<CoinType> extends ChatiwalMessageBase {
    type: ChatiwalMessageType.COMPOUND;
    timeLockPolicy: {
        from: number;
        to: number;
    };
    limitedReadPolicy: {
        maxReads: number;
    };
    feePolicy: {
        fee: number;
        recipient: string;
    };
    readers: string[];
    feeCollected: number;
    coinType: CoinType;
}

export type ChatiwalMessage<CoinType = string> =
    | MessageNoPolicy
    | MessageTimeLock
    | MessageLimitedRead
    | MessageFeeBased<CoinType>
    | ChatiwalMessageCompound<CoinType>;