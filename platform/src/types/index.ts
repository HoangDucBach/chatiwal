import { MetadataGroup } from "@/libs/schema";

export type MediaContent = {
    id: string;
    url?: string;
    raw?: Uint8Array;
    name?: string;
    size?: number;
    duration?: number;
    dimensions?: {
        width: number;
        height: number;
    };
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
    createdAt?: number;
};

export type TMessageNoPolicy = TMessageBase & {
    type: TMessageType.NO_POLICY;
};

export type TMessageTimeLock = TMessageBase & {
    type: TMessageType.TIME_LOCK;
    policy: {
        from: number;
        to: number;
    };
};

export type TMessageLimitedRead = TMessageBase & {
    type: TMessageType.LIMITED_READ;
    policy: {
        maxReads: number;
    };
    readers: string[];
};

export type TMessageFeeBased = TMessageBase & {
    type: TMessageType.FEE_BASED;
    policy: {
        fee: number;
        recipient: string;
    };
    readers: string[];
    feeCollected: number;
    coinType: string;
};

export type TMessageCompound = TMessageBase & {
    type: TMessageType.COMPOUND;
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
    coinType: string;
};

export type TMessage =
    | TMessageNoPolicy
    | TMessageTimeLock
    | TMessageLimitedRead
    | TMessageFeeBased
    | TMessageCompound;