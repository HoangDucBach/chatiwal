#[allow(lint(share_owned, self_transfer))]
/// Message module of Chatiwal
///
/// This module defines the core `Message` structure in the Chatiwal protocol,
/// supporting encrypted content, controlled access policies, ownership, and
/// optional persistence.
module chatiwal::message;

use chatiwal::events;
use chatiwal::group::{Group, approve_internal};
use chatiwal::message_policy::{Self, TimeLockPolicy, LimitedReadPolicy, FeeBasedPolicy};
use chatiwal::utils::is_prefix;
use std::string::String;
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::vec_set::{Self, VecSet};

// === Error Codes ===

const ETimeLockTooEarly: u64 = 2001;
const ETimeLockExpired: u64 = 2002;
const EMaxReadsReached: u64 = 2003;
const EInsufficientPayment: u64 = 2004;
const EAlreadyPaid: u64 = 2005;
const ENotMessageOwner: u64 = 2006;
const ENoFeesToWithdraw: u64 = 2007;
const ESealApprovalFailed: u64 = 2008;
const ENotMessageRecipient: u64 = 2009;
const ENotMatch: u64 = 2010;

// === Access Control ===

public struct MessageOwnerCap has key {
    id: UID,
    msg_id: ID,
}

public struct SuperMessageNoPolicy has key, store {
    id: UID,
    group_id: ID,
    message_blob_id: String,
    owner: address,
}

// === Structs ===

public struct MessagesSnapshot has key {
    id: UID,
    group_id: ID,
    messages_blob_id: String,
}

public struct MessagesSnapshotCap has key {
    id: UID,
    messages_snapshot_id: ID,
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

// === Entry Functions ===

public entry fun mint_messages_snapshot_and_transfer(
    g_id: ID,
    mt_b_id: String,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let snap = do_mint_messages_snapshot(g_id, mt_b_id, c, ctx);
    transfer::transfer(snap, tx_context::sender(ctx));
}

public entry fun mint_messages_snapshot_cap_and_transfer(msg_snapshot_id: ID, ctx: &mut TxContext) {
    let cap = do_mint_messages_snapshot_cap(msg_snapshot_id, ctx);
    transfer::transfer(cap, tx_context::sender(ctx));
}

fun mint_message_owner_cap_and_transfer(msg_id: ID, ctx: &mut TxContext) {
    let cap = do_mint_message_owner_cap(msg_id, ctx);
    transfer::transfer(cap, tx_context::sender(ctx));
}

public entry fun mint_super_message_no_policy_and_transfer(
    g_id: ID,
    mt_b_id: String,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let msg = do_mint_super_message_no_policy(g_id, mt_b_id, s, c, ctx);

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);
    transfer::share_object(msg);
}

public entry fun mint_super_message_time_lock_and_transfer(
    g_id: ID,
    mt_b_id: String,
    from: u64,
    to: u64,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let msg = do_mint_super_message_time_lock(g_id, mt_b_id, from, to, s, c, ctx);

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);
    transfer::share_object(msg);
}

public entry fun mint_super_message_limited_read_and_transfer(
    g_id: ID,
    mt_b_id: String,
    max: u64,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let msg = do_mint_super_message_limited_read(g_id, mt_b_id, max, s, c, ctx);

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);
    transfer::share_object(msg);
}

public entry fun mint_super_message_fee_based_and_transfer<CoinType>(
    g_id: ID,
    mt_b_id: String,
    fee: u64,
    r: address,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let msg = do_mint_super_message_fee_based<CoinType>(g_id, mt_b_id, fee, r, s, c, ctx);

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);
    transfer::share_object(msg);
}

public entry fun mint_super_message_compound_and_transfer<CoinType>(
    g_id: ID,
    mt_b_id: String,
    tf: u64,
    tt: u64,
    max: u64,
    fee: u64,
    receipient: address,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let msg = do_mint_super_message_compound<CoinType>(
        g_id,
        mt_b_id,
        tf,
        tt,
        max,
        fee,
        receipient,
        s,
        c,
        ctx,
    );

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);
    transfer::share_object(msg);
}

// === Internal Creation Functions ===

fun do_mint_messages_snapshot(
    g_id: ID,
    mt_b_id: String,
    c: &Clock,
    ctx: &mut TxContext,
): MessagesSnapshot {
    let snap = mint_messages_snapshot_impl(g_id, mt_b_id, ctx);
    let ts = c.timestamp_ms();

    events::emit_messages_snapshot_minted(
        object::id(&snap),
        snap.group_id,
        snap.messages_blob_id,
        ts,
    );

    snap
}

fun mint_messages_snapshot_impl(g_id: ID, mt_b_id: String, ctx: &mut TxContext): MessagesSnapshot {
    MessagesSnapshot {
        id: object::new(ctx),
        group_id: g_id,
        messages_blob_id: mt_b_id,
    }
}

fun do_mint_messages_snapshot_cap(msg_snapshot_id: ID, ctx: &mut TxContext): MessagesSnapshotCap {
    let cap = mint_messages_snapshot_cap_impl(msg_snapshot_id, ctx);

    events::emit_messages_snapshot_cap_minted(
        object::id(&cap),
        cap.messages_snapshot_id,
    );

    cap
}

fun mint_messages_snapshot_cap_impl(msg_snapshot_id: ID, ctx: &mut TxContext): MessagesSnapshotCap {
    MessagesSnapshotCap {
        id: object::new(ctx),
        messages_snapshot_id: msg_snapshot_id,
    }
}

fun do_mint_message_owner_cap(msg_id: ID, ctx: &mut TxContext): MessageOwnerCap {
    mint_message_owner_cap_impl(msg_id, ctx)
}

fun mint_message_owner_cap_impl(msg_id: ID, ctx: &mut TxContext): MessageOwnerCap {
    MessageOwnerCap {
        id: object::new(ctx),
        msg_id: msg_id,
    }
}

fun do_mint_super_message_no_policy(
    g_id: ID,
    mt_b_id: String,
    owner: address,
    c: &Clock,
    ctx: &mut TxContext,
): SuperMessageNoPolicy {
    let msg = mint_super_message_no_policy_impl(g_id, mt_b_id, owner, ctx);
    let ts = c.timestamp_ms();

    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        ts,
    );

    msg
}

fun mint_super_message_no_policy_impl(
    g_id: ID,
    mt_b_id: String,
    owner: address,
    ctx: &mut TxContext,
): SuperMessageNoPolicy {
    SuperMessageNoPolicy {
        id: object::new(ctx),
        group_id: g_id,
        message_blob_id: mt_b_id,
        owner,
    }
}

fun do_mint_super_message_time_lock(
    g_id: ID,
    mt_b_id: String,
    from: u64,
    to: u64,
    owner: address,
    c: &Clock,
    ctx: &mut TxContext,
): SuperMessageTimeLock {
    let msg = mint_super_message_time_lock_impl(g_id, mt_b_id, from, to, owner, ctx);
    let ts = c.timestamp_ms();

    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        ts,
    );

    msg
}

fun mint_super_message_time_lock_impl(
    g_id: ID,
    mt_b_id: String,
    from: u64,
    to: u64,
    owner: address,
    ctx: &mut TxContext,
): SuperMessageTimeLock {
    let p = message_policy::create_time_lock_policy(from, to);

    SuperMessageTimeLock {
        id: object::new(ctx),
        group_id: g_id,
        message_blob_id: mt_b_id,
        policy: p,
        owner,
    }
}

fun do_mint_super_message_limited_read(
    g_id: ID,
    mt_b_id: String,
    max: u64,
    owner: address,
    c: &Clock,
    ctx: &mut TxContext,
): SuperMessageLimitedRead {
    let msg = mint_super_message_limited_read_impl(g_id, mt_b_id, max, owner, ctx);
    let ts = c.timestamp_ms();

    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        ts,
    );

    msg
}

fun mint_super_message_limited_read_impl(
    g_id: ID,
    mt_b_id: String,
    max: u64,
    owner: address,
    ctx: &mut TxContext,
): SuperMessageLimitedRead {
    let p = message_policy::create_limited_read_policy(max);

    SuperMessageLimitedRead {
        id: object::new(ctx),
        group_id: g_id,
        message_blob_id: mt_b_id,
        policy: p,
        owner,
        readers: vec_set::empty(),
    }
}

fun do_mint_super_message_fee_based<CoinType>(
    g_id: ID,
    mt_b_id: String,
    fee: u64,
    recipient: address,
    owner: address,
    c: &Clock,
    ctx: &mut TxContext,
): SuperMessageFeeBased<CoinType> {
    let msg = mint_super_message_fee_based_impl<CoinType>(
        g_id,
        mt_b_id,
        fee,
        recipient,
        owner,
        ctx,
    );
    let ts = c.timestamp_ms();

    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        ts,
    );

    msg
}

fun mint_super_message_fee_based_impl<CoinType>(
    g_id: ID,
    mt_b_id: String,
    fee: u64,
    recipient: address,
    owner: address,
    ctx: &mut TxContext,
): SuperMessageFeeBased<CoinType> {
    let p = message_policy::create_fee_based_policy<CoinType>(fee, recipient);

    SuperMessageFeeBased<CoinType> {
        id: object::new(ctx),
        group_id: g_id,
        message_blob_id: mt_b_id,
        policy: p,
        owner,
        readers: vec_set::empty(),
        fee_collected: balance::zero(),
    }
}

fun do_mint_super_message_compound<CoinType>(
    g_id: ID,
    mt_b_id: String,
    time_from: u64,
    time_to: u64,
    max_reads: u64,
    fee: u64,
    recipient: address,
    owner: address,
    c: &Clock,
    ctx: &mut TxContext,
): SuperMessageCompound<CoinType> {
    let msg = mint_super_message_compound_impl<CoinType>(
        g_id,
        mt_b_id,
        time_from,
        time_to,
        max_reads,
        fee,
        recipient,
        owner,
        ctx,
    );
    let ts = c.timestamp_ms();

    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        ts,
    );

    msg
}

fun mint_super_message_compound_impl<CoinType>(
    g_id: ID,
    mt_b_id: String,
    time_from: u64,
    time_to: u64,
    max_reads: u64,
    fee: u64,
    recipient: address,
    owner: address,
    ctx: &mut TxContext,
): SuperMessageCompound<CoinType> {
    let tl = message_policy::create_time_lock_policy(time_from, time_to);
    let lr = message_policy::create_limited_read_policy(max_reads);
    let fp = message_policy::create_fee_based_policy<CoinType>(fee, recipient);

    SuperMessageCompound<CoinType> {
        id: object::new(ctx),
        group_id: g_id,
        message_blob_id: mt_b_id,
        time_lock: tl,
        limited_read: lr,
        fee_policy: fp,
        owner,
        fee_collected: balance::zero(),
        readers: vec_set::empty(),
    }
}

// === Message Reading Functions ===

// Read a message with no policy
public entry fun read_message_no_policy(
    msg: &SuperMessageNoPolicy,
    c: &Clock,
    ctx: &mut TxContext,
) {
    do_read_message_no_policy(msg, c, ctx);
}

fun do_read_message_no_policy(msg: &SuperMessageNoPolicy, c: &Clock, ctx: &TxContext) {
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
    do_read_message_time_lock(msg, c, ctx);
}

fun do_read_message_time_lock(msg: &SuperMessageTimeLock, c: &Clock, ctx: &TxContext) {
    let now = c.timestamp_ms();
    let r = tx_context::sender(ctx);
    let id = object::id(msg);

    read_message_time_lock_impl(msg, now);

    events::emit_message_read(
        id,
        r,
        0,
        now,
    );
}

fun read_message_time_lock_impl(msg: &SuperMessageTimeLock, now: u64) {
    let from = msg.policy.time_lock_policy_get_from();
    let to = msg.policy.time_lock_policy_get_to();

    assert!(now >= from, ETimeLockTooEarly);
    assert!(now <= to || to == 0, ETimeLockExpired);
}

public entry fun read_message_limited_read(
    msg: &mut SuperMessageLimitedRead,
    c: &Clock,
    ctx: &mut TxContext,
) {
    do_read_message_limited_read(msg, c, ctx);
}

fun do_read_message_limited_read(msg: &mut SuperMessageLimitedRead, c: &Clock, ctx: &TxContext) {
    let r = tx_context::sender(ctx);
    let id = object::id(msg);

    read_message_limited_read_impl(msg, r);

    events::emit_message_read(
        id,
        r,
        0,
        c.timestamp_ms(),
    );
}

fun read_message_limited_read_impl(msg: &mut SuperMessageLimitedRead, reader: address) {
    let rs = &mut msg.readers;
    let max = msg.policy.limited_read_policy_get_max();

    assert!(rs.size() < max, EMaxReadsReached);
    assert!(!rs.contains(&reader), EAlreadyPaid);

    rs.insert(reader);
}

// Read a fee-based message
public entry fun read_message_fee_based<CoinType>(
    msg: &mut SuperMessageFeeBased<CoinType>,
    p: Coin<CoinType>,
    c: &Clock,
    ctx: &mut TxContext,
) {
    do_read_message_fee_based(msg, p, c, ctx);
}

fun do_read_message_fee_based<CoinType>(
    msg: &mut SuperMessageFeeBased<CoinType>,
    p: Coin<CoinType>,
    c: &Clock,
    ctx: &TxContext,
) {
    let r = tx_context::sender(ctx);
    let id = object::id(msg);
    let amt = coin::value(&p);

    read_message_fee_based_impl(msg, p, r);

    events::emit_message_read(
        id,
        r,
        amt,
        c.timestamp_ms(),
    );
}

fun read_message_fee_based_impl<CoinType>(
    msg: &mut SuperMessageFeeBased<CoinType>,
    p: Coin<CoinType>,
    reader: address,
) {
    let fee = msg.policy.fee_based_policy_get_fee_amount<CoinType>();
    let fc = &mut msg.fee_collected;
    let paid = msg.readers.contains(&reader);

    assert!(coin::value(&p) >= fee, EInsufficientPayment);
    assert!(!paid, EAlreadyPaid);

    let pb = coin::into_balance(p);
    fc.join(pb);

    msg.readers.insert(reader);
}

// Read a compound message (time lock + limited read + fee)
public entry fun read_message_compound<CoinType>(
    msg: &mut SuperMessageCompound<CoinType>,
    p: Coin<CoinType>,
    c: &Clock,
    ctx: &mut TxContext,
) {
    do_read_message_compound(msg, p, c, ctx);
}

fun do_read_message_compound<CoinType>(
    msg: &mut SuperMessageCompound<CoinType>,
    p: Coin<CoinType>,
    c: &Clock,
    ctx: &TxContext,
) {
    let now = c.timestamp_ms();
    let r = tx_context::sender(ctx);
    let id = object::id(msg);
    let amt = coin::value(&p);

    read_message_compound_impl(msg, p, r, now);

    events::emit_message_read(
        id,
        r,
        amt,
        now,
    );
}

fun read_message_compound_impl<CoinType>(
    msg: &mut SuperMessageCompound<CoinType>,
    p: Coin<CoinType>,
    reader: address,
    now: u64,
) {
    let fee = msg.fee_policy.fee_based_policy_get_fee_amount<CoinType>();
    let from = msg.time_lock.time_lock_policy_get_from();
    let to = msg.time_lock.time_lock_policy_get_to();
    let max = msg.limited_read.limited_read_policy_get_max();
    let cnt = msg.readers.size();

    assert!(now >= from, ETimeLockTooEarly);
    assert!(now <= to || to == 0, ETimeLockExpired);
    assert!(cnt < max, EMaxReadsReached);
    assert!(!msg.readers.contains(&reader), EAlreadyPaid);
    assert!(coin::value(&p) >= fee, EInsufficientPayment);

    let pb = coin::into_balance(p);
    balance::join(&mut msg.fee_collected, pb);

    msg.readers.insert(reader);
}

// === Fee Collection Functions ===

// Allow message owner to withdraw collected fees
public entry fun withdraw_fees<CoinType>(
    msg: &mut SuperMessageFeeBased<CoinType>,
    c: &Clock,
    ctx: &mut TxContext,
) {
    do_withdraw_fees(msg, c, ctx);
}

fun do_withdraw_fees<CoinType>(
    msg: &mut SuperMessageFeeBased<CoinType>,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let amt = withdraw_fees_impl(msg, s);

    let coin = coin::from_balance(balance::split(&mut msg.fee_collected, amt), ctx);
    transfer::public_transfer(coin, s);

    events::emit_fees_withdrawn(
        object::id(msg),
        msg.owner,
        amt,
        c.timestamp_ms(),
    );
}

fun withdraw_fees_impl<CoinType>(msg: &SuperMessageFeeBased<CoinType>, recipient: address): u64 {
    assert!(
        msg.policy.fee_based_policy_get_recipient<CoinType>() == recipient,
        ENotMessageRecipient,
    );

    let amt = balance::value(&msg.fee_collected);
    assert!(amt > 0, ENoFeesToWithdraw);

    amt
}

// Allow message owner to withdraw collected fees from compound message
public entry fun withdraw_fees_compound<CoinType>(
    msg: &mut SuperMessageCompound<CoinType>,
    c: &Clock,
    ctx: &mut TxContext,
) {
    do_withdraw_fees_compound(msg, c, ctx);
}

fun do_withdraw_fees_compound<CoinType>(
    msg: &mut SuperMessageCompound<CoinType>,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let amt = withdraw_fees_compound_impl(msg, s);

    let coin = coin::from_balance(balance::split(&mut msg.fee_collected, amt), ctx);
    transfer::public_transfer(coin, s);

    events::emit_fees_withdrawn(
        object::id(msg),
        s,
        amt,
        c.timestamp_ms(),
    );
}

fun withdraw_fees_compound_impl<CoinType>(
    msg: &SuperMessageCompound<CoinType>,
    recipient: address,
): u64 {
    let amt = balance::value(&msg.fee_collected);

    assert!(amt > 0, ENoFeesToWithdraw);
    assert!(
        msg.fee_policy.fee_based_policy_get_recipient<CoinType>() == recipient,
        ENotMessageRecipient,
    );

    amt
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
    group: &Group,
    c: &Clock,
    ctx: &TxContext,
) {
    assert!(group.group_get_group_id() == msg.group_id, ENotMatch);
    assert!(approve_internal(id, ctx.sender(), group), ESealApprovalFailed);
    assert!(approve_internal_for_super_message_time_lock(id, msg, c), ESealApprovalFailed);
}

entry fun seal_approve_super_message_limited_read(
    id: vector<u8>,
    msg: &SuperMessageLimitedRead,
    group: &Group,
    ctx: &TxContext,
) {
    assert!(group.group_get_group_id() == msg.group_id, ENotMatch);
    assert!(approve_internal(id, ctx.sender(), group), ESealApprovalFailed);
    assert!(approve_internal_for_super_message_limited_read(id, msg, ctx), ESealApprovalFailed);
}

entry fun seal_approve_super_message_fee_based<CoinType>(
    id: vector<u8>,
    msg: &SuperMessageFeeBased<CoinType>,
    group: &Group,
    ctx: &TxContext,
) {
    assert!(group.group_get_group_id() == msg.group_id, ENotMatch);
    assert!(approve_internal_for_super_message_fee_based(id, msg, ctx), ESealApprovalFailed);
    assert!(approve_internal(id, ctx.sender(), group), ESealApprovalFailed);
}

entry fun seal_approve_super_message_compound<CoinType>(
    id: vector<u8>,
    msg: &SuperMessageCompound<CoinType>,
    group: &Group,
    ctx: &TxContext,
) {
    assert!(group.group_get_group_id() == msg.group_id, ENotMatch);
    assert!(approve_internal(id, ctx.sender(), group), ESealApprovalFailed);
    assert!(approve_internal_for_super_message_compound(id, msg, ctx), ESealApprovalFailed);
}

// === Helper Functions ===

public fun get_current_reader(msg: &SuperMessageLimitedRead): u64 {
    msg.readers.size()
}

public fun get_collected_fees<CoinType>(msg: &SuperMessageFeeBased<CoinType>): u64 {
    balance::value(&msg.fee_collected)
}

public fun get_collected_fees_compound<CoinType>(msg: &SuperMessageCompound<CoinType>): u64 {
    balance::value(&msg.fee_collected)
}

public fun get_remaining_reads(msg: &SuperMessageLimitedRead): u64 {
    msg.policy.limited_read_policy_get_max() - msg.readers.size()
}

public fun is_readable_by_time(msg: &SuperMessageTimeLock, ts: u64): bool {
    let from = msg.policy.time_lock_policy_get_from();
    let to = msg.policy.time_lock_policy_get_to();
    ts >= from && (ts <= to || to == 0)
}

// === Accessors ===

public fun message_cap_get_id(msg_cap: &MessageOwnerCap): ID {
    msg_cap.id.to_inner()
}

public fun message_cap_get_message_id(msg_cap: &MessageOwnerCap): ID {
    msg_cap.msg_id
}

public fun message_snapshot_cap_get_id(msg_snapshot_cap: &MessagesSnapshotCap): ID {
    object::id(msg_snapshot_cap)
}

public fun message_snapshot_cap_get_messages_snapshot_id(
    msg_snapshot_cap: &MessagesSnapshotCap,
): ID {
    msg_snapshot_cap.messages_snapshot_id
}

public fun message_snapshot_get_id(msg_snapshot: &MessagesSnapshot): ID {
    object::id(msg_snapshot)
}

public fun message_snapshot_get_group_id(msg_snapshot: &MessagesSnapshot): ID {
    msg_snapshot.group_id
}

public fun message_snapshot_get_messages_blob_id(msg_snapshot: &MessagesSnapshot): String {
    msg_snapshot.messages_blob_id
}

public fun message_no_policy_get_id(msg: &SuperMessageNoPolicy): ID {
    object::id(msg)
}

public fun message_no_policy_get_group_id(msg: &SuperMessageNoPolicy): ID {
    msg.group_id
}

public fun message_no_policy_get_message_blob_id(msg: &SuperMessageNoPolicy): String {
    msg.message_blob_id
}

public fun message_no_policy_get_owner(msg: &SuperMessageNoPolicy): address {
    msg.owner
}

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
