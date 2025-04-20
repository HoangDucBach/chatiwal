export enum ChatiwalMediaType {
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    DOCUMENT = 'document',
    GIF = 'gif'
}

export interface OnchainObject {
    id: string;
}

export interface ChatiwalMediaContent {
    id: string;
    type: ChatiwalMediaType;
    url: string;
    thumbnailUrl?: string;
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
    address: string;
    groupId: string;
    messageBlobId?: string;
    content: {
        text?: string;
        media?: ChatiwalMediaContent[];
    };
    createdAt: Date;
    metadata?: Record<string, any>;
}

export interface ChatiwalEncryptedMessage {
    id: string; //random it not be stored, else it will be used as messageId
    groupId: string;
    type: ChatiwalMessageType;
    encryptedData: Uint8Array;
    createdAt: Date;
}

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

export interface ChatiwalMessagesSnapshot {
    id: string;
    groupId: string;
    messagesBlobId: string;
    createdAt: Date;
}

export interface ChatiwalMessageOwnerCap {
    id: string;
    messageId: string;
}
