module chatiwal::message;

use chatiwal::events;
use chatiwal::message_policy::{Self, TimeLockPolicy, LimitedReadPolicy, FeeBasedPolicy};
use chatiwal::utils::is_prefix;
use std::string::String;
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::vec_set::{Self, VecSet};

// === Error Codes ===

const ETimeLockTooEarly: u64 = 1;
const ETimeLockExpired: u64 = 2;
const EMaxReadsReached: u64 = 3;
const EInsufficientPayment: u64 = 4;
const EAlreadyPaid: u64 = 5;
const ENotMessageOwner: u64 = 6;
const ENoFeesToWithdraw: u64 = 7;
const ESealApprovalFailed: u64 = 8;

// === Messages Snapshot Types ===

public struct MessagesSnapshot has key {
    id: UID,
    group_id: ID,
    messages_blob_id: String,
}

public struct MessagesSnapshotCap has key {
    id: UID,
    messages_snapshot_id: ID,
}

// === Access Control ===
public struct MessageOwnerCap has key {
    id: UID,
    msg_id: ID,
}

// === Super Message Types ===
public struct SuperMessageNoPolicy has key, store {
    id: UID,
    group_id: ID,
    message_blob_id: String,
    owner: address,
}

public struct SuperMessageTimeLock has key, store {
    id: UID,
    group_id: ID,
    message_blob_id: String,
    policy: TimeLockPolicy,
    owner: address,
}

public struct SuperMessageLimitedRead has key, store {
    id: UID,
    group_id: ID,
    message_blob_id: String,
    policy: LimitedReadPolicy,
    owner: address,
    readers: VecSet<address>,
}

public struct SuperMessageFeeBased<phantom CoinType> has key, store {
    id: UID,
    group_id: ID,
    message_blob_id: String,
    policy: FeeBasedPolicy<CoinType>,
    owner: address,
    readers: VecSet<address>,
    fee_collected: Balance<CoinType>, // state for fee-based policy
}

public struct SuperMessageCompound<phantom CoinType> has key, store {
    id: UID,
    group_id: ID,
    message_blob_id: String,
    time_lock: TimeLockPolicy,
    limited_read: LimitedReadPolicy,
    fee_policy: FeeBasedPolicy<CoinType>,
    owner: address,
    fee_collected: Balance<CoinType>, // state for fee-based policy
    readers: VecSet<address>, // state for limited read policy, fee-based policy
}

// === Messages Snapshot Functions ===
public entry fun mint_messages_snapshot_and_transfer(
    gid: ID,
    bid: String,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let snap = MessagesSnapshot {
        id: object::new(ctx),
        group_id: gid,
        messages_blob_id: bid,
    };

    let ts = c.timestamp_ms();
    events::emit_messages_snapshot_minted(
        object::id(&snap),
        snap.group_id,
        snap.messages_blob_id,
        ts,
    );

    transfer::transfer(snap, tx_context::sender(ctx));
}

public entry fun mint_messages_snapshot_cap_and_transfer(sid: ID, ctx: &mut TxContext) {
    let cap = MessagesSnapshotCap {
        id: object::new(ctx),
        messages_snapshot_id: sid,
    };

    events::emit_messages_snapshot_cap_minted(
        object::id(&cap),
        cap.messages_snapshot_id,
    );

    transfer::transfer(cap, tx_context::sender(ctx));
}

// === Message Owner Cap Functions ===
public entry fun mint_message_owner_cap_and_transfer(mid: ID, ctx: &mut TxContext) {
    let cap = MessageOwnerCap {
        id: object::new(ctx),
        msg_id: mid,
    };
    transfer::transfer(cap, tx_context::sender(ctx));
}

// === Super Message Creation Functions ===
public entry fun mint_super_message_no_policy_and_transfer(
    gid: ID,
    bid: String,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let msg = SuperMessageNoPolicy {
        id: object::new(ctx),
        group_id: gid,
        message_blob_id: bid,
        owner: s,
    };

    let ts = c.timestamp_ms();
    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        ts,
    );

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);

    transfer::share_object(msg);
}

public entry fun mint_super_message_time_lock_and_transfer(
    gid: ID,
    bid: String,
    from: u64,
    to: u64,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let p = message_policy::create_time_lock_policy(from, to);
    let msg = SuperMessageTimeLock {
        id: object::new(ctx),
        group_id: gid,
        message_blob_id: bid,
        policy: p,
        owner: s,
    };

    let ts = c.timestamp_ms();
    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        ts,
    );

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);

    transfer::share_object(msg);
}

public entry fun mint_super_message_limited_read_and_transfer(
    gid: ID,
    bid: String,
    max: u64,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let p = message_policy::create_limited_read_policy(max);
    let msg = SuperMessageLimitedRead {
        id: object::new(ctx),
        group_id: gid,
        message_blob_id: bid,
        policy: p,
        owner: s,
        readers: vec_set::empty(),
    };

    let ts = c.timestamp_ms();
    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        ts,
    );

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);

    transfer::share_object(msg);
}

public entry fun mint_super_message_fee_based_and_transfer<CoinType>(
    gid: ID,
    bid: String,
    fee: u64,
    r: address,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let p = message_policy::create_fee_based_policy<CoinType>(fee, r);

    let msg = SuperMessageFeeBased<CoinType> {
        id: object::new(ctx),
        group_id: gid,
        message_blob_id: bid,
        policy: p,
        owner: s,
        readers: vec_set::empty(),
        fee_collected: balance::zero(),
    };

    let ts = c.timestamp_ms();
    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        ts,
    );

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);
    transfer::share_object(msg);
}

public entry fun mint_super_message_compound_and_transfer<CoinType>(
    gid: ID,
    bid: String,
    tf: u64,
    tt: u64,
    max: u64,
    fee: u64,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let tl = message_policy::create_time_lock_policy(tf, tt);
    let lr = message_policy::create_limited_read_policy(max);
    let fp = message_policy::create_fee_based_policy<CoinType>(fee, s);

    let msg = SuperMessageCompound<CoinType> {
        id: object::new(ctx),
        group_id: gid,
        message_blob_id: bid,
        time_lock: tl,
        limited_read: lr,
        fee_policy: fp,
        owner: s,
        fee_collected: balance::zero(),
        readers: vec_set::empty(),
    };

    let ts = c.timestamp_ms();
    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        ts,
    );

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);

    transfer::share_object(msg);
}

// === Message Reading Functions ===

// Read a message with no policy
public entry fun read_message_no_policy(
    msg: &SuperMessageNoPolicy,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let r = tx_context::sender(ctx);
    let id = object::id(msg);

    events::emit_message_read(
        id,
        r,
        0,
        c.timestamp_ms(),
    );
}

// Read a time-locked message
public entry fun read_message_time_lock(
    msg: &SuperMessageTimeLock,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let now = c.timestamp_ms();
    let r = tx_context::sender(ctx);
    let id = object::id(msg);
    let from = msg.policy.time_lock_policy_get_from();
    let to = msg.policy.time_lock_policy_get_to();

    assert!(now >= from, ETimeLockTooEarly);
    assert!(now <= to || to == 0, ETimeLockExpired);

    events::emit_message_read(
        id,
        r,
        0,
        now,
    );
}

// Read a message with limited reads
public entry fun read_message_limited_read(
    msg: &mut SuperMessageLimitedRead,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let r = tx_context::sender(ctx);
    let id = object::id(msg);
    let rs = &mut msg.readers;
    let max = msg.policy.limited_read_policy_get_max();

    assert!(rs.size() < max, EMaxReadsReached);

    rs.insert(r);

    events::emit_message_read(
        id,
        r,
        0,
        c.timestamp_ms(),
    );
}

// Read a fee-based message
public entry fun read_message_fee_based<CoinType>(
    msg: &mut SuperMessageFeeBased<CoinType>,
    p: Coin<CoinType>,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let r = tx_context::sender(ctx);
    let id = object::id(msg);
    let fee = msg.policy.fee_based_policy_get_fee_amount<CoinType>();
    let fc = &mut msg.fee_collected;
    let paid = msg.readers.contains(&r);

    assert!(p.value() >= fee, EInsufficientPayment);
    assert!(!paid, EAlreadyPaid);

    let amt = p.value();
    let pb = coin::into_balance(p);
    fc.join(pb);

    msg.readers.insert(r);

    events::emit_message_read(
        id,
        r,
        amt,
        c.timestamp_ms(),
    );
}

// Read a compound message (time lock + limited read + fee)
public entry fun read_message_compound<CoinType>(
    msg: &mut SuperMessageCompound<CoinType>,
    p: Coin<CoinType>,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let now = c.timestamp_ms();
    let r = tx_context::sender(ctx);
    let id = object::id(msg);
    let fee = msg.fee_policy.fee_based_policy_get_fee_amount<CoinType>();
    let from = msg.time_lock.time_lock_policy_get_from();
    let to = msg.time_lock.time_lock_policy_get_to();
    let max = msg.limited_read.limited_read_policy_get_max();
    let cnt = msg.readers.size();

    assert!(now >= from, ETimeLockTooEarly);
    assert!(now <= to || to == 0, ETimeLockExpired);
    assert!(cnt < max, EMaxReadsReached);
    assert!(!msg.readers.contains(&r), EAlreadyPaid);
    assert!(coin::value(&p) >= fee, EInsufficientPayment);

    let amt = coin::value(&p);
    let pb = coin::into_balance(p);
    balance::join(&mut msg.fee_collected, pb);

    msg.readers.insert(r);

    events::emit_message_read(
        id,
        r,
        amt,
        now,
    );
}

// === Fee Collection Functions ===

// Allow message owner to withdraw collected fees
public entry fun withdraw_fees<CoinType>(
    msg: &mut SuperMessageFeeBased<CoinType>,
    cap: &MessageOwnerCap,
    c: &Clock,
    ctx: &mut TxContext,
) {
    assert!(object::id(msg) == cap.msg_id, ENotMessageOwner);

    let amt = balance::value(&msg.fee_collected);
    assert!(amt > 0, ENoFeesToWithdraw);

    let coin = coin::from_balance(balance::split(&mut msg.fee_collected, amt), ctx);
    transfer::public_transfer(coin, msg.owner);

    events::emit_fees_withdrawn(
        object::id(msg),
        msg.owner,
        amt,
        c.timestamp_ms(),
    );
}

// Allow message owner to withdraw collected fees from compound message
public entry fun withdraw_fees_compound<CoinType>(
    msg: &mut SuperMessageCompound<CoinType>,
    cap: &MessageOwnerCap,
    c: &Clock,
    ctx: &mut TxContext,
) {
    assert!(object::id(msg) == cap.msg_id, ENotMessageOwner);

    let amt = balance::value(&msg.fee_collected);
    assert!(amt > 0, ENoFeesToWithdraw);

    let coin = coin::from_balance(balance::split(&mut msg.fee_collected, amt), ctx);
    transfer::public_transfer(coin, msg.owner);

    events::emit_fees_withdrawn(
        object::id(msg),
        msg.owner,
        amt,
        c.timestamp_ms(),
    );
}

// === Seal Interface ===
fun approve_internal_for_super_message_time_lock(
    id: vector<u8>,
    msg: &SuperMessageTimeLock,
    c: &Clock,
): bool {
    let ts = c.timestamp_ms();
    let from = msg.policy.time_lock_policy_get_from();
    let to = msg.policy.time_lock_policy_get_to();

    if (from > ts) {
        return false
    };

    if (to != 0 && to < ts) {
        return false
    };

    is_prefix(msg.id.to_bytes(), id)
}

fun approve_internal_for_super_message_limited_read(
    id: vector<u8>,
    msg: &SuperMessageLimitedRead,
    ctx: &TxContext,
): bool {
    let r = msg.readers;

    if (!r.contains(&tx_context::sender(ctx))) {
        return false
    };

    is_prefix(msg.id.to_bytes(), id)
}

fun approve_internal_for_super_message_fee_based<CoinType>(
    id: vector<u8>,
    msg: &SuperMessageFeeBased<CoinType>,
    ctx: &TxContext,
): bool {
    let r = msg.readers;

    if (!r.contains(&tx_context::sender(ctx))) {
        return false
    };

    is_prefix(msg.id.to_bytes(), id)
}

fun approve_internal_for_super_message_compound<CoinType>(
    id: vector<u8>,
    msg: &SuperMessageCompound<CoinType>,
    ctx: &TxContext,
): bool {
    let r = msg.readers;

    if (!r.contains(&tx_context::sender(ctx))) {
        return false
    };

    is_prefix(msg.id.to_bytes(), id)
}

entry fun seal_approve_super_message_time_lock(
    id: vector<u8>,
    msg: &SuperMessageTimeLock,
    c: &Clock,
) {
    assert!(approve_internal_for_super_message_time_lock(id, msg, c), ESealApprovalFailed);
}

entry fun seal_approve_super_message_limited_read(
    id: vector<u8>,
    msg: &SuperMessageLimitedRead,
    ctx: &TxContext,
) {
    assert!(approve_internal_for_super_message_limited_read(id, msg, ctx), ESealApprovalFailed);
}

entry fun seal_approve_super_message_fee_based<CoinType>(
    id: vector<u8>,
    msg: &SuperMessageFeeBased<CoinType>,
    ctx: &TxContext,
) {
    assert!(approve_internal_for_super_message_fee_based(id, msg, ctx), ESealApprovalFailed);
}

entry fun seal_approve_super_message_compound<CoinType>(
    id: vector<u8>,
    msg: &SuperMessageCompound<CoinType>,
    ctx: &TxContext,
) {
    assert!(approve_internal_for_super_message_compound(id, msg, ctx), ESealApprovalFailed);
}

// === Helper Functions ===

// Get total read count for a limited read message
public fun get_current_reader(msg: &SuperMessageLimitedRead): u64 {
    msg.readers.size()
}

// Get collected fees amount
public fun get_collected_fees<CoinType>(msg: &SuperMessageFeeBased<CoinType>): u64 {
    balance::value(&msg.fee_collected)
}

// Get collected fees amount from compound message
public fun get_collected_fees_compound<CoinType>(msg: &SuperMessageCompound<CoinType>): u64 {
    balance::value(&msg.fee_collected)
}

// Get remaining available reads
public fun get_remaining_reads(msg: &SuperMessageLimitedRead): u64 {
    msg.policy.limited_read_policy_get_max() - msg.readers.size()
}

// Check if message is readable based on time lock
public fun is_readable_by_time(msg: &SuperMessageTimeLock, ts: u64): bool {
    let from = msg.policy.time_lock_policy_get_from();
    let to = msg.policy.time_lock_policy_get_to();
    ts >= from && (ts <= to || to == 0)
}

// Getter functions for all message types
public fun message_limit_read_get_id(msg: &SuperMessageLimitedRead): ID {
    object::id(msg)
}

public fun message_limit_read_get_group_id(msg: &SuperMessageLimitedRead): ID {
    msg.group_id
}

public fun message_limit_read_get_message_blob_id(msg: &SuperMessageLimitedRead): String {
    msg.message_blob_id
}

public fun message_limit_read_get_policy(msg: &SuperMessageLimitedRead): LimitedReadPolicy {
    msg.policy
}

public fun message_limit_read_get_owner(msg: &SuperMessageLimitedRead): address {
    msg.owner
}

public fun message_limit_read_get_readers(msg: &SuperMessageLimitedRead): VecSet<address> {
    msg.readers
}

public fun message_time_lock_get_id(msg: &SuperMessageTimeLock): ID {
    object::id(msg)
}

public fun message_time_lock_get_group_id(msg: &SuperMessageTimeLock): ID {
    msg.group_id
}

public fun message_time_lock_get_message_blob_id(msg: &SuperMessageTimeLock): String {
    msg.message_blob_id
}

public fun message_time_lock_get_policy(msg: &SuperMessageTimeLock): TimeLockPolicy {
    msg.policy
}

public fun message_time_lock_get_owner(msg: &SuperMessageTimeLock): address {
    msg.owner
}

public fun message_fee_based_get_id<CoinType>(msg: &SuperMessageFeeBased<CoinType>): ID {
    object::id(msg)
}

public fun message_fee_based_get_group_id<CoinType>(msg: &SuperMessageFeeBased<CoinType>): ID {
    msg.group_id
}

public fun message_fee_based_get_message_blob_id<CoinType>(
    msg: &SuperMessageFeeBased<CoinType>,
): String {
    msg.message_blob_id
}

public fun message_fee_based_get_policy<CoinType>(
    msg: &SuperMessageFeeBased<CoinType>,
): &FeeBasedPolicy<CoinType> {
    &msg.policy
}

public fun message_fee_based_get_owner<CoinType>(msg: &SuperMessageFeeBased<CoinType>): address {
    msg.owner
}

public fun message_fee_based_get_readers<CoinType>(
    msg: &SuperMessageFeeBased<CoinType>,
): VecSet<address> {
    msg.readers
}

public fun message_fee_based_get_fee_collected<CoinType>(
    msg: &SuperMessageFeeBased<CoinType>,
): &Balance<CoinType> {
    &msg.fee_collected
}

public fun message_compound_get_id<CoinType>(msg: &SuperMessageCompound<CoinType>): ID {
    object::id(msg)
}

public fun message_compound_get_group_id<CoinType>(msg: &SuperMessageCompound<CoinType>): ID {
    msg.group_id
}

public fun message_compound_get_message_blob_id<CoinType>(
    msg: &SuperMessageCompound<CoinType>,
): String {
    msg.message_blob_id
}

public fun message_compound_get_time_lock<CoinType>(
    msg: &SuperMessageCompound<CoinType>,
): TimeLockPolicy {
    msg.time_lock
}

public fun message_compound_get_limited_read<CoinType>(
    msg: &SuperMessageCompound<CoinType>,
): LimitedReadPolicy {
    msg.limited_read
}

public fun message_compound_get_fee_policy<CoinType>(
    msg: &SuperMessageCompound<CoinType>,
): &FeeBasedPolicy<CoinType> {
    &msg.fee_policy
}

public fun message_compound_get_owner<CoinType>(msg: &SuperMessageCompound<CoinType>): address {
    msg.owner
}

public fun message_compound_get_fee_collected<CoinType>(
    msg: &SuperMessageCompound<CoinType>,
): &Balance<CoinType> {
    &msg.fee_collected
}

public fun message_compound_get_readers<CoinType>(
    msg: &SuperMessageCompound<CoinType>,
): VecSet<address> {
    msg.readers
}

public fun message_compound_get_remaining_reads<CoinType>(
    msg: &SuperMessageCompound<CoinType>,
): u64 {
    msg.limited_read.limited_read_policy_get_max() - msg.readers.size()
}
