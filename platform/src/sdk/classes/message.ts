import { Address, ID } from "./utils";
import {
    TimeLockPolicy,
    LimitedReadPolicy,
    FeeBasedPolicy,
    ICompoundPolicyMessage,
    IPolicyMessage,
} from "./policy";
import { fromHex, toHex } from "@mysten/sui/utils";
import { random } from "nanoid";

export enum MessageType {
    NoPolicy = "NoPolicy",
    TimeLock = "TimeLock",
    LimitedRead = "LimitedRead",
    FeeBased = "FeeBased",
    Compound = "Compound",
}

export enum MessageDataType {
    BlobReference = "BlobReference",
    Inline = "Inline",
}

export interface MessageDataBlobReference {
    type: MessageDataType.BlobReference;
    blobId: string;
}

export interface MessageDataInline {
    type: MessageDataType.Inline;
    content: any;
}

export type MessageData = MessageDataBlobReference | MessageDataInline;

interface MessageOptionsBase {
    id?: ID;
    id_size?: number;
    groupId: ID;
    data: MessageData;
    owner: Address;
}

export interface NoPolicyOptions extends MessageOptionsBase {
}

export interface TimeLockOptions extends MessageOptionsBase {
    policy: TimeLockPolicy;
}

export interface LimitedReadOptions extends MessageOptionsBase {
    policy: LimitedReadPolicy;
}

export interface FeeBasedOptions extends MessageOptionsBase {
    type: MessageType.FeeBased;
    policy: FeeBasedPolicy;
}

export interface CompoundOptions extends MessageOptionsBase {
    type: MessageType.Compound;
    timeLock: TimeLockPolicy;
    limitedRead: LimitedReadPolicy;
    feePolicy: FeeBasedPolicy;
}

export type MessageOptions =
    | NoPolicyOptions
    | TimeLockOptions
    | LimitedReadOptions
    | FeeBasedOptions
    | CompoundOptions;


export abstract class MessageBase {
    protected id: ID;
    protected groupId: ID;
    protected data: MessageData;
    protected owner: Address;

    constructor(options: MessageOptions) {
        const nonce =random(5);
        const groupIdToBytes = fromHex(options.groupId);
        const id = toHex(new Uint8Array([...groupIdToBytes, ...nonce]));

        this.id = options.id || id;
        this.groupId = options.groupId;
        this.data = options.data;
        this.owner = options.owner;
    }

    abstract getType(): MessageType;

    getId(): ID {
        return this.id;
    }

    getGroupId(): ID {
        return this.groupId;
    }

    setData(data: MessageData): MessageBase {
        this.data = data;
        return this;
    }

    getData(): MessageData {
        return this.data;
    }

    getOwner(): Address {
        return this.owner;
    }
}

export class SuperMessageNoPolicy extends MessageBase {
    constructor(options: NoPolicyOptions) {
        super(options);
    }

    getType(): MessageType {
        return MessageType.NoPolicy;
    }
}

export class SuperMessageTimeLock extends MessageBase implements IPolicyMessage {
    private policy: TimeLockPolicy;

    constructor(options: TimeLockOptions) {
        super(options);
        this.policy = options.policy;
    }

    getPolicy(): TimeLockPolicy {
        return this.policy;
    }

    getType(): MessageType {
        return MessageType.TimeLock;
    }
}

export class SuperMessageLimitedRead extends MessageBase implements IPolicyMessage {
    private policy: LimitedReadPolicy;
    private readers: Set<Address> = new Set();

    constructor(options: LimitedReadOptions) {
        super(options);
        this.policy = options.policy;
    }

    getPolicy(): LimitedReadPolicy {
        return this.policy;
    }

    getReaders(): Set<Address> {
        return this.readers;
    }

    addReader(address: Address): void {
        this.readers.add(address);
    }

    getType(): MessageType {
        return MessageType.LimitedRead;
    }
}

export class SuperMessageFeeBased extends MessageBase implements IPolicyMessage {
    private policy: FeeBasedPolicy;
    private readers: Set<Address> = new Set();
    private feeCollected: bigint = 0n;

    constructor(options: FeeBasedOptions) {
        super(options);
        this.policy = options.policy;
    }

    getPolicy(): FeeBasedPolicy {
        return this.policy;
    }

    getReaders(): Set<Address> {
        return this.readers;
    }

    addReader(address: Address): void {
        this.readers.add(address);
    }

    collectFee(amount: bigint): void {
        this.feeCollected += amount;
    }

    getCollectedFee(): bigint {
        return this.feeCollected;
    }

    getType(): MessageType {
        return MessageType.FeeBased;
    }
}

export class SuperMessageCompound extends MessageBase implements ICompoundPolicyMessage {
    private timeLock: TimeLockPolicy;
    private limitedRead: LimitedReadPolicy;
    private feePolicy: FeeBasedPolicy;
    private readers: Set<Address> = new Set();
    private feeCollected: bigint = 0n;

    constructor(options: CompoundOptions) {
        super(options);
        this.timeLock = options.timeLock;
        this.limitedRead = options.limitedRead;
        this.feePolicy = options.feePolicy;
    }

    getTimeLockPolicy(): TimeLockPolicy {
        return this.timeLock;
    }

    getLimitedReadPolicy(): LimitedReadPolicy {
        return this.limitedRead;
    }

    getFeeBasedPolicy(): FeeBasedPolicy {
        return this.feePolicy;
    }

    getReaders(): Set<Address> {
        return this.readers;
    }

    getCollectedFee(): bigint {
        return this.feeCollected;
    }

    addReader(address: Address): void {
        this.readers.add(address);
    }

    collectFee(amount: bigint): void {
        this.feeCollected += amount;
    }

    getType(): MessageType {
        return MessageType.Compound;
    }
}