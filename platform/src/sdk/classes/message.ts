import { Address, ID } from "./utils";
import {
  TimeLockPolicy,
  LimitedReadPolicy,
  FeeBasedPolicy
} from "./policy";

export interface MessageOptions {
  id: ID;
  groupId: ID;
  messageBlobId: string;
  owner: Address;
}

export class SuperMessageNoPolicy {
  protected id: ID;
  protected groupId: ID;
  protected messageBlobId: string;
  protected owner: Address;

  constructor(options: MessageOptions) {
    this.id = options.id;
    this.groupId = options.groupId;
    this.messageBlobId = options.messageBlobId;
    this.owner = options.owner;
  }

  getId(): ID {
    return this.id;
  }

  getGroupId(): ID {
    return this.groupId;
  }

  getMessageBlobId(): string {
    return this.messageBlobId;
  }

  getOwner(): Address {
    return this.owner;
  }
}

export class SuperMessageTimeLock extends SuperMessageNoPolicy {
  private policy: TimeLockPolicy;

  constructor(options: MessageOptions & { policy: TimeLockPolicy }) {
    super(options);
    this.policy = options.policy;
  }

  getPolicy(): TimeLockPolicy {
    return this.policy;
  }
}

export class SuperMessageLimitedRead extends SuperMessageNoPolicy {
  private policy: LimitedReadPolicy;
  private readers: Set<Address> = new Set();

  constructor(options: MessageOptions & { policy: LimitedReadPolicy }) {
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
}

export class SuperMessageFeeBased extends SuperMessageNoPolicy {
  private policy: FeeBasedPolicy;
  private readers: Set<Address> = new Set();
  private feeCollected: bigint = 0n;

  constructor(options: MessageOptions & { policy: FeeBasedPolicy }) {
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
}

export class SuperMessageCompound extends SuperMessageNoPolicy {
  private timeLock: TimeLockPolicy;
  private limitedRead: LimitedReadPolicy;
  private feePolicy: FeeBasedPolicy;
  private readers: Set<Address> = new Set();
  private feeCollected: bigint = 0n;

  constructor(options: MessageOptions & {
    timeLock: TimeLockPolicy;
    limitedRead: LimitedReadPolicy;
    feePolicy: FeeBasedPolicy;
  }) {
    super(options);
    this.timeLock = options.timeLock;
    this.limitedRead = options.limitedRead;
    this.feePolicy = options.feePolicy;
  }

  getTimeLock(): TimeLockPolicy {
    return this.timeLock;
  }

  getLimitedRead(): LimitedReadPolicy {
    return this.limitedRead;
  }

  getFeePolicy(): FeeBasedPolicy {
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
}