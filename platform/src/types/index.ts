export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    DOCUMENT = 'document',
    GIF = 'gif'
}

export type MediaContent = {
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
};

export type TGroup = {
    id: string;
    name: string;
    description: string;
    owner: string;
    members: string[];
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
    content: {
        text?: string;
        media?: MediaContent[];
    };
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

export type TMessageFeeBased<CoinType = string> = TMessageBase & {
    type: TMessageType.FEE_BASED;
    policy: {
        fee: number;
        recipient: string;
    };
    readers: string[];
    feeCollected: number;
    coinType: CoinType;
};

export type TMessageCompound<CoinType = string> = TMessageBase & {
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
    coinType: CoinType;
};

export type TMessage<CoinType = string> =
    | TMessageNoPolicy
    | TMessageTimeLock
    | TMessageLimitedRead
    | TMessageFeeBased<CoinType>
    | TMessageCompound<CoinType>;