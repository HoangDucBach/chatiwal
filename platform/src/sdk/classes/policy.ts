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