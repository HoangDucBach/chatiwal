module chatiwal::message_policy;

// === Errors ===

const EInvalidTimeRange: u64 = 3000;
const EInvalidMaxRead: u64 = 3001;
const EInvalidFeeAmount: u64 = 3002;

// === Structs ===

/// Time Lock Policy: TLP
public struct TimeLockPolicy has copy, drop, store {
    from: u64,
    to: u64,
}

/// Limited Read Policy: LRP
public struct LimitedReadPolicy has copy, drop, store {
    max: u64,
}

/// Fee Based Policy: FBP
public struct FeeBasedPolicy<phantom CoinType> has drop, store {
    fee_amount: u64,
    recipient: address,
}

// === Constructors ===

public fun create_time_lock_policy(from: u64, to: u64): TimeLockPolicy {
    assert!(from < to, EInvalidTimeRange);
    TimeLockPolicy { from, to }
}

public fun create_limited_read_policy(max: u64): LimitedReadPolicy {
    assert!(max > 0, EInvalidMaxRead);
    LimitedReadPolicy { max }
}

public fun create_fee_based_policy<CoinType>(
    fee_amount: u64,
    recipient: address,
): FeeBasedPolicy<CoinType> {
    assert!(fee_amount > 0, EInvalidFeeAmount);
    FeeBasedPolicy {
        fee_amount: fee_amount,
        recipient,
    }
}

// === Accessors ===

public fun time_lock_policy_get_from(policy: &TimeLockPolicy): u64 {
    policy.from
}

public fun time_lock_policy_get_to(policy: &TimeLockPolicy): u64 {
    policy.to
}

public fun limited_read_policy_get_max(policy: &LimitedReadPolicy): u64 {
    policy.max
}

public fun fee_based_policy_get_fee_amount<CoinType>(policy: &FeeBasedPolicy<CoinType>): u64 {
    policy.fee_amount
}

public fun fee_based_policy_get_recipient<CoinType>(policy: &FeeBasedPolicy<CoinType>): address {
    policy.recipient
}
