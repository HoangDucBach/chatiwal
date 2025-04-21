import { Address } from "./utils";

export interface TimeLockPolicy {
    startTime: number;
    endTime: number;
}

export interface LimitedReadPolicy {
    maxReads: number;
}

export interface FeeBasedPolicy {
    feeAmount: bigint;
    coinType: string; // e.g. "SUI"
}

export interface IPolicyMessage {
    getPolicy(): TimeLockPolicy | LimitedReadPolicy | FeeBasedPolicy;
}

export interface ICompoundPolicyMessage {
    getTimeLockPolicy(): TimeLockPolicy;
    getLimitedReadPolicy(): LimitedReadPolicy;
    getFeeBasedPolicy(): FeeBasedPolicy;
}