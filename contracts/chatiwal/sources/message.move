#[allow(lint(share_owned, self_transfer))]
/// Message module of Chatiwal
///
/// This module defines the core `Message` structure in the Chatiwal protocol,
/// supporting encrypted content, controlled access policies, ownership, and
/// optional persistence.
///
/// Super Message Policy
/// - Only group members can read the message if they satisfy the super message’s policy.
module chatiwal::message;

use chatiwal::events;
use chatiwal::group::{Group, approve_internal};
use chatiwal::message_policy::{Self, TimeLockPolicy, LimitedReadPolicy, FeeBasedPolicy};
use chatiwal::utils::is_prefix;
use std::string::String;
use std::u64;
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::vec_set::{Self, VecSet};

// === Error Codes ===
const ETimeLockTooEarly: u64 = 2001;
const ETimeLockExpired: u64 = 2002;
const EMaxReadsReached: u64 = 2003;
const EInsufficientPayment: u64 = 2004;
const EAlreadyPaid: u64 = 2005;
const EPaymentNotAllowed: u64 = 2006;
const ENoFeesToWithdraw: u64 = 2007;
const ENoAccess: u64 = 2008;
const ENotMessageRecipient: u64 = 2009;
const ENotMatch: u64 = 2010;

// === Access Control ===
public struct MessageOwnerCap has key {
    id: UID,
    msg_id: ID,
}

// === Message Structs ===

public struct SuperMessage has key, store {
    id: UID,
    group_id: ID,
    aux_id: vector<u8>,
    message_blob_id: String,
    // Optional policies - use null values to indicate not used
    time_lock: Option<TimeLockPolicy>,
    limited_read: Option<LimitedReadPolicy>,
    fee_policy: Option<FeeBasedPolicy<SUI>>,
    // Common fields
    owner: address,
    fee_collected: Balance<SUI>,
    readers: VecSet<address>,
    created_at: u64,
}

public struct MessagesSnapshot has key {
    id: UID,
    group_id: ID,
    messages_blob_id: String,
}

public struct MessagesSnapshotCap has key {
    id: UID,
    messages_snapshot_id: ID,
}

// === Entry Functions ===

// Messages Snapshot Functions
public entry fun mint_messages_snapshot_and_transfer(
    g_id: ID,
    mt_b_id: String,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let snap = MessagesSnapshot {
        id: object::new(ctx),
        group_id: g_id,
        messages_blob_id: mt_b_id,
    };

    events::emit_messages_snapshot_minted(
        object::id(&snap),
        snap.group_id,
        snap.messages_blob_id,
        c.timestamp_ms(),
    );

    transfer::transfer(snap, tx_context::sender(ctx));
}

public entry fun mint_messages_snapshot_cap_and_transfer(msg_snapshot_id: ID, ctx: &mut TxContext) {
    let cap = MessagesSnapshotCap {
        id: object::new(ctx),
        messages_snapshot_id: msg_snapshot_id,
    };

    events::emit_messages_snapshot_cap_minted(
        object::id(&cap),
        cap.messages_snapshot_id,
    );

    transfer::transfer(cap, tx_context::sender(ctx));
}

// Helper function to create and transfer message owner cap
fun mint_message_owner_cap_and_transfer(msg_id: ID, ctx: &mut TxContext) {
    let cap = MessageOwnerCap {
        id: object::new(ctx),
        msg_id,
    };
    transfer::transfer(cap, tx_context::sender(ctx));
}

// SuperMessage creation functions
public entry fun mint_super_message_no_policy_and_transfer(
    g_id: ID,
    mt_b_id: String,
    aux_id: vector<u8>,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let msg = SuperMessage {
        id: object::new(ctx),
        group_id: g_id,
        aux_id: aux_id,
        message_blob_id: mt_b_id,
        time_lock: option::none(),
        limited_read: option::none(),
        fee_policy: option::none(),
        owner: s,
        fee_collected: balance::zero(),
        readers: vec_set::empty(),
        created_at: c.timestamp_ms(),
    };

    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        c.timestamp_ms(),
    );

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);
    transfer::share_object(msg);
}

public entry fun mint_super_message_time_lock_and_transfer(
    g_id: ID,
    mt_b_id: String,
    aux_id: vector<u8>,
    from: u64,
    to: u64,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let p = message_policy::create_time_lock_policy(from, to);

    let msg = SuperMessage {
        id: object::new(ctx),
        group_id: g_id,
        aux_id: aux_id,
        message_blob_id: mt_b_id,
        time_lock: option::some(p),
        limited_read: option::none(),
        fee_policy: option::none(),
        owner: s,
        fee_collected: balance::zero(),
        readers: vec_set::empty(),
        created_at: c.timestamp_ms(),
    };

    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        c.timestamp_ms(),
    );

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);
    transfer::share_object(msg);
}

public entry fun mint_super_message_limited_read_and_transfer(
    g_id: ID,
    mt_b_id: String,
    aux_id: vector<u8>,
    max: u64,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let p = message_policy::create_limited_read_policy(max);

    let msg = SuperMessage {
        id: object::new(ctx),
        group_id: g_id,
        aux_id: aux_id,
        message_blob_id: mt_b_id,
        time_lock: option::none(),
        limited_read: option::some(p),
        fee_policy: option::none(),
        owner: s,
        fee_collected: balance::zero(),
        readers: vec_set::empty(),
        created_at: c.timestamp_ms(),
    };

    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        c.timestamp_ms(),
    );

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);
    transfer::share_object(msg);
}

// === Message Reading Functions ===

// Unified read message function
public entry fun read_message(
    msg: &mut SuperMessage,
    mut payment: Coin<SUI>,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let r = tx_context::sender(ctx);
    let now = c.timestamp_ms();
    let mut paid_recored = 0u64;

    // Check time lock policy if it exists
    if (option::is_some(&msg.time_lock)) {
        let tl = option::borrow(&msg.time_lock);
        let from = message_policy::time_lock_policy_get_from(tl);
        let to = message_policy::time_lock_policy_get_to(tl);
        assert!(now >= from, ETimeLockTooEarly);
        assert!(now <= to || to == 0, ETimeLockExpired);
    };

    // Check limited read policy if it exists
    if (option::is_some(&msg.limited_read)) {
        let lr = option::borrow(&msg.limited_read);
        let max = message_policy::limited_read_policy_get_max(lr);
        assert!(vec_set::size(&msg.readers) < max, EMaxReadsReached);
    };

    // Check fee policy if it exists
    if (option::is_some(&msg.fee_policy)) {
        let fp = option::borrow(&msg.fee_policy);
        let fee = message_policy::fee_based_policy_get_fee_amount(fp);
        let paid_value = coin::value(&payment);
        assert!(paid_value >= fee, EInsufficientPayment);
        paid_recored = fee;

        // Take only the required fee amount
        if (paid_value > fee) {
            // Return excess payment
            let excess = coin::split(&mut payment, paid_value - fee, ctx);
            transfer::public_transfer(excess, r);
        };

        // Take the required fee
        let pb = coin::into_balance(payment);
        balance::join(&mut msg.fee_collected, pb);
    } else {
        // If no fee policy, make sure no payment was provided
        assert!(coin::value(&payment) == 0, EPaymentNotAllowed);
        // Return the empty coin to avoid leaking resources
        transfer::public_transfer(payment, r);
    };

    assert!(!vec_set::contains(&msg.readers, &r), EAlreadyPaid);

    vec_set::insert(&mut msg.readers, r);

    events::emit_message_read(
        object::id(msg),
        r,
        paid_recored,
        now,
    );
}

public entry fun mint_super_message_fee_based_and_transfer(
    g_id: ID,
    mt_b_id: String,
    fee: u64,
    r: address,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let p = message_policy::create_fee_based_policy(fee, r);

    let msg = SuperMessage {
        id: object::new(ctx),
        group_id: g_id,
        aux_id: vector::empty(),
        message_blob_id: mt_b_id,
        time_lock: option::none(),
        limited_read: option::none(),
        fee_policy: option::some(p),
        owner: s,
        fee_collected: balance::zero(),
        readers: vec_set::empty(),
        created_at: c.timestamp_ms(),
    };

    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        c.timestamp_ms(),
    );

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);
    transfer::share_object(msg);
}

public entry fun mint_super_message_compound_and_transfer(
    g_id: ID,
    mt_b_id: String,
    aux_id: vector<u8>,
    tf: u64,
    tt: u64,
    max: u64,
    fee: u64,
    receipient: address,
    c: &Clock,
    ctx: &mut TxContext,
) {
    let s = tx_context::sender(ctx);
    let tl = message_policy::create_time_lock_policy(tf, tt);
    let lr = message_policy::create_limited_read_policy(max);
    let fp = message_policy::create_fee_based_policy(fee, receipient);

    let msg = SuperMessage {
        id: object::new(ctx),
        group_id: g_id,
        aux_id: aux_id,
        message_blob_id: mt_b_id,
        time_lock: option::some(tl),
        limited_read: option::some(lr),
        fee_policy: option::some(fp),
        owner: s,
        fee_collected: balance::zero(),
        readers: vec_set::empty(),
        created_at: c.timestamp_ms(),
    };

    events::emit_super_message_minted(
        object::id(&msg),
        msg.group_id,
        c.timestamp_ms(),
    );

    mint_message_owner_cap_and_transfer(object::id(&msg), ctx);
    transfer::share_object(msg);
}

// === Fee Collection Functions ===

// Allow message owner to withdraw collected fees
public entry fun withdraw_fees(msg: &mut SuperMessage, c: &Clock, ctx: &mut TxContext) {
    let s = tx_context::sender(ctx);

    // Verify fee policy exists
    assert!(option::is_some(&msg.fee_policy), ENoFeesToWithdraw);

    let fp = option::borrow(&msg.fee_policy);
    let recipient = fp.fee_based_policy_get_recipient();

    assert!(recipient == s, ENotMessageRecipient);

    let amt = balance::value(&msg.fee_collected);
    assert!(amt > 0, ENoFeesToWithdraw);

    let coin = coin::from_balance(balance::split(&mut msg.fee_collected, amt), ctx);
    transfer::public_transfer(coin, s);

    events::emit_fees_withdrawn(
        object::id(msg),
        msg.owner,
        amt,
        c.timestamp_ms(),
    );
}

// === Seal Interface ===

/// key format: [pkg id][group_id][hash(content)][nonce]
entry fun seal_approve_super_message(
    id: vector<u8>,
    msg: &SuperMessage,
    group: &Group,
    c: &Clock,
    ctx: &TxContext,
) {
    assert!(group.group_get_group_id() == msg.group_id, ENotMatch);
    assert!(check_policy(id, msg, c, ctx), ENoAccess);
}

fun check_policy(id: vector<u8>, msg: &SuperMessage, c: &Clock, ctx: &TxContext): bool {
    let mut pass = true;

    // Check prefixx
    if (msg.aux_id !=id) {
        return false
    };

    // Check time lock policy if it exists
    if (option::is_some(&msg.time_lock)) {
        let tl = option::borrow(&msg.time_lock);
        let ts = c.timestamp_ms();
        let from = tl.time_lock_policy_get_from();
        let to = tl.time_lock_policy_get_to();
        pass = pass && (from <= ts) && (to == 0 || to >= ts);
    };

    // Check limited read policy if it exists
    if (option::is_some(&msg.limited_read) || option::is_some(&msg.fee_policy)) {
        pass = pass && msg.readers.contains(&tx_context::sender(ctx));
    };

    pass
}

// === Helper Functions ===

public fun get_current_reader(msg: &SuperMessage): u64 {
    msg.readers.size()
}

public fun get_collected_fees(msg: &SuperMessage): u64 {
    balance::value(&msg.fee_collected)
}

public fun get_remaining_reads(msg: &SuperMessage): u64 {
    if (option::is_some(&msg.limited_read)) {
        let lr = option::borrow(&msg.limited_read);
        lr.limited_read_policy_get_max() - msg.readers.size()
    } else {
        u64::max_value!()
    }
}

public fun is_readable_by_time(msg: &SuperMessage, ts: u64): bool {
    if (option::is_some(&msg.time_lock)) {
        let tl = option::borrow(&msg.time_lock);
        let from = tl.time_lock_policy_get_from();
        let to = tl.time_lock_policy_get_to();
        ts >= from && (ts <= to || to == 0)
    } else {
        true
    }
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

public fun message_get_id(msg: &SuperMessage): ID {
    object::id(msg)
}

public fun message_get_group_id(msg: &SuperMessage): ID {
    msg.group_id
}

public fun message_get_message_blob_id(msg: &SuperMessage): String {
    msg.message_blob_id
}

public fun message_get_time_lock(msg: &SuperMessage): Option<TimeLockPolicy> {
    msg.time_lock
}

public fun message_get_limited_read(msg: &SuperMessage): Option<LimitedReadPolicy> {
    msg.limited_read
}

public fun message_get_fee_policy(msg: &SuperMessage): &Option<FeeBasedPolicy<SUI>> {
    &msg.fee_policy
}

public fun message_get_owner(msg: &SuperMessage): address {
    msg.owner
}

public fun message_get_readers(msg: &SuperMessage): VecSet<address> {
    msg.readers
}

public fun message_get_fee_collected(msg: &SuperMessage): &Balance<SUI> {
    &msg.fee_collected
}
