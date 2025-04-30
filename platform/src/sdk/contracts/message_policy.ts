
import { bcs } from "@mysten/sui/bcs";

export const TimeLockPolicyStruct = bcs.struct("TimeLockPolicy", {
    from: bcs.U64,
    to: bcs.U64
})

export const LimitedReadPolicyStruct = bcs.struct("LimitedReadPolicy", {
    max: bcs.U64
});

export const FeeBasedPolicyStruct = bcs.struct("FeeBasedPolicy", {
    fee_amount: bcs.U64,
    recipient: bcs.Address
});
