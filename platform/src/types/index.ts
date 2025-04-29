import { MetadataGroup } from "@/libs/schema";

export type MediaContent = {
    id: string;
    url?: string;
    raw?: string | Uint8Array;
    mimeType: string;
};

export type TGroup = {
    id: string;
    members: Set<string>;
    metadata?: MetadataGroup;
};

export enum TMessageType {
    NO_POLICY = 'no-policy',
    TIME_LOCK = 'time-lock',
    LIMITED_READ = 'limited-read',
    FEE_BASED = 'fee-based',
    COMPOUND = 'compound'
}

export type TMessageBase = {
    id: string;
    owner: string;
    groupId: string;
    content?: MediaContent[];
    blobId?: string;
    createdAt?: number;
};

export type TMessageNoPolicy = TMessageBase & {
    type: TMessageType.NO_POLICY;
};

export type TMessageTimeLock = TMessageBase & {
    type: TMessageType.TIME_LOCK;
    policy: {
        from: number | bigint | string;
        to: number | bigint | string;
    };
};

export type TMessageLimitedRead = TMessageBase & {
    type: TMessageType.LIMITED_READ;
    policy: {
        maxReads: number | bigint | string;
    };
    readers: string[];
};

export type TMessageFeeBased = TMessageBase & {
    type: TMessageType.FEE_BASED;
    policy: {
        fee: bigint | number | string;
        recipient: string;
    };
    readers: string[];
    feeCollected: bigint | number | string;
    coinType: string;
};

export type TMessageCompound = TMessageBase & {
    type: TMessageType.COMPOUND;
    timeLockPolicy: {
        from: number | bigint | string;
        to: number | bigint | string;
    };
    limitedReadPolicy: {
        maxReads: number | bigint | string;
    };
    feePolicy: {
        fee: number | bigint | string;
        recipient: string;
    };
    readers: string[];
    feeCollected: number | bigint | string;
    coinType: string;
};

export type TMessage =
    | TMessageNoPolicy
    | TMessageTimeLock
    | TMessageLimitedRead
    | TMessageFeeBased
    | TMessageCompound;