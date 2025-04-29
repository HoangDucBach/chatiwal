// public struct TimeLockPolicy has copy, drop, store {
//     from: u64,
//     to: u64,
// }

import { bcs, BcsType } from "@mysten/sui/bcs";

export const TimeLockPolicyStruct = bcs.struct("TimeLockPolicy", {
    from: bcs.U64,
    to: bcs.U64
})

export const LimitedReadPolicyStruct = bcs.struct("LimitedReadPolicy", {
    max: bcs.U64
});

// export const FeeBasedPolicyStruct = bcs.struct("FeeBasedPolicy", {
//     fee_amount: bcs.U64,
//     recipient: bcs.Address
// });

export function FeeBasedPolicyStruct<CoinType extends BcsType<any>>(CoinType: CoinType) {
    return bcs.struct(`FeeBasedPolicy<${CoinType.name}>`, {
        fee_amount: bcs.U64,
        recipient: bcs.Address,
    });
}
