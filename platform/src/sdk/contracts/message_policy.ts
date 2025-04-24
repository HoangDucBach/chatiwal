// public struct TimeLockPolicy has copy, drop, store {
//     from: u64,
//     to: u64,
// }

import { bcs } from "@mysten/sui/bcs";

export const TimeLockPolicy = bcs.struct("TimeLockPolicy", {
    from: bcs.U64,
    to: bcs.U64
})

export const LimitedReadPolicy = bcs.struct("LimitedReadPolicy", {
    max: bcs.U64
});

export const FeeBasedPolicy = bcs.struct("FeeBasedPolicy", {
    fee_amount: bcs.U64,
    recipient: bcs.Address
});