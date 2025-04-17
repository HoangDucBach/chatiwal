// chatiwal/sources/message_tests.move
#[test_module]
module chatiwal::message_tests;

use chatiwal::message::{
    Self as message_module,
    SuperMessageNoPolicy,
    SuperMessageTimeLock,
    SuperMessageLimitedRead,
    SuperMessageFeeBased,
    SuperMessageCompound,
    MessageOwnerCap,
    ETimeLockNotYetActive,
    ETimeLockExpired,
    EMaxReadsReached,
    EInsufficientPayment,
    EAlreadyReadOrPaid,
    ENotMessageOwner,
    ENoFeesToWithdraw,
    ESealApprovalFailed,
    EInvalidIdPrefix
};
use chatiwal::message_policy as policy_module;
use std::string::utf8;
use sui::balance::{Self, Balance};
use sui::clock::{Self, Clock, new_for_testing as new_clock, advance_ms};
use sui::coin::{Self, Coin, mint_for_testing as mint_coin, burn_for_testing as burn_coin};
use sui::object::{Self, ID, UID};
use sui::sui::SUI;
use sui::test_scenario::{Self as ts, Scenario, next_tx, ctx};
use sui::test_utils::{assert_eq, assert};
use sui::vec_set::{Self, VecSet};

// === Test Constants ===
const OWNER: address = @0xA;
const READER_1: address = @0xB;
const READER_2: address = @0xC;
const READER_3: address = @0xD;
const RECIPIENT: address = @0xE; // Separate recipient for fees
const OTHER_USER: address = @0xF;

const GROUP_ID: ID = object::id_from_address(@0x123);
const BLOB_ID: vector<u8> = b"test_message_blob";

const START_TIME: u64 = 1000;
const END_TIME: u64 = 2000;
const MAX_READS: u64 = 2;
const FEE_AMOUNT: u64 = 100;
const PAYMENT_EXACT: u64 = 100;
const PAYMENT_MORE: u64 = 150;
const PAYMENT_LESS: u64 = 50;

// === Helper Functions ===

fun setup_scenario(): (Scenario, Clock) {
    let scenario = ts::begin(OWNER);
    let clock = new_clock(ctx(&mut scenario));
    advance_ms(&mut clock, START_TIME - 10); // Start slightly before START_TIME
    (scenario, clock)
}

fun string_blob(): String {
    utf8(BLOB_ID)
}

fun mint_test_sui(scenario: &mut Scenario, recipient: address, amount: u64): Coin<SUI> {
    let coin = mint_coin<SUI>(amount, ctx(scenario));
    // Need to explicitly transfer if recipient != current sender
    // For simplicity in tests, usually mint for the current sender or manage transfers explicitly
    coin // Assuming minted for current sender unless transferred
}

fun get_owner_cap(scenario: &Scenario, owner: address, msg_id: ID): MessageOwnerCap {
    ts::take_owned_by_address<MessageOwnerCap>(scenario, owner, |cap: &MessageOwnerCap| {
            cap.msg_id == msg_id
        })
}

fun return_owner_cap(scenario: &mut Scenario, cap: MessageOwnerCap) {
    ts::return_owned(scenario, cap);
}

// === Test Cases ===

// --- Minting Tests ---

#[test]
fun test_mint_no_policy() {
    let (mut scenario, clock) = setup_scenario();

    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_no_policy_and_transfer(
        GROUP_ID,
        string_blob(),
        &clock,
        ctx(&mut scenario),
    );

    // Check shared object exists and owner cap exists
    let msg_ref = ts::take_shared<SuperMessageNoPolicy>(&scenario);
    assert_eq(message_module::get_owner(&msg_ref), OWNER);
    assert_eq(message_module::get_group_id(&msg_ref), GROUP_ID);
    let msg_id = object::id(&msg_ref);
    ts::return_shared(msg_ref);

    let cap = get_owner_cap(&scenario, OWNER, msg_id);
    return_owner_cap(&mut scenario, cap); // Return cap

    ts::end(scenario);
}

#[test]
fun test_mint_time_lock() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_time_lock_and_transfer(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        &clock,
        ctx(&mut scenario),
    );
    // Check shared object exists and owner cap exists
    let msg_ref = ts::take_shared<SuperMessageTimeLock>(&scenario);
    assert_eq(message_module::get_owner(&msg_ref), OWNER);
    let policy = message_module::get_time_lock_policy(&msg_ref);
    assert_eq(policy_module::time_lock_policy_get_from(policy), START_TIME);
    assert_eq(policy_module::time_lock_policy_get_to(policy), END_TIME);
    let msg_id = object::id(&msg_ref);
    ts::return_shared(msg_ref);

    let cap = get_owner_cap(&scenario, OWNER, msg_id);
    return_owner_cap(&mut scenario, cap);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::chatiwal::message_policy::EInvalidTimeRange)]
fun test_mint_time_lock_fail_invalid_range() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    // From >= To
    message_module::mint_super_message_time_lock_and_transfer(
        GROUP_ID,
        string_blob(),
        END_TIME,
        START_TIME,
        &clock,
        ctx(&mut scenario),
    );
    ts::end(scenario); // Should not be reached
}

#[test]
fun test_mint_limited_read() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_limited_read_and_transfer(
        GROUP_ID,
        string_blob(),
        MAX_READS,
        &clock,
        ctx(&mut scenario),
    );
    // Check shared object exists and owner cap exists
    let msg_ref = ts::take_shared<SuperMessageLimitedRead>(&scenario);
    assert_eq(message_module::get_owner(&msg_ref), OWNER);
    assert_eq(message_module::get_read_count(&msg_ref), 0);
    assert_eq(message_module::get_remaining_reads(&msg_ref), MAX_READS);
    let policy = message_module::get_limited_read_policy(&msg_ref);
    assert_eq(policy_module::limited_read_policy_get_max(policy), MAX_READS);
    let msg_id = object::id(&msg_ref);
    ts::return_shared(msg_ref);

    let cap = get_owner_cap(&scenario, OWNER, msg_id);
    return_owner_cap(&mut scenario, cap);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::chatiwal::message_policy::EInvalidMaxReads)]
fun test_mint_limited_read_fail_zero_max() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_limited_read_and_transfer(
        GROUP_ID,
        string_blob(),
        0,
        &clock,
        ctx(&mut scenario),
    );
    ts::end(scenario); // Should not be reached
}

#[test]
fun test_mint_fee_based() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_fee_based_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );
    // Check shared object exists and owner cap exists
    let msg_ref = ts::take_shared<SuperMessageFeeBased<SUI>>(&scenario);
    assert_eq(message_module::get_owner(&msg_ref), OWNER);
    assert_eq(message_module::get_collected_fees(&msg_ref), 0);
    let policy = message_module::get_fee_based_policy(&msg_ref);
    assert_eq(policy_module::fee_based_policy_get_fee_amount<SUI>(policy), FEE_AMOUNT);
    assert_eq(policy_module::fee_based_policy_get_recipient<SUI>(policy), RECIPIENT);
    let msg_id = object::id(&msg_ref);
    ts::return_shared(msg_ref);

    let cap = get_owner_cap(&scenario, OWNER, msg_id);
    return_owner_cap(&mut scenario, cap);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::chatiwal::message_policy::EInvalidFeeAmount)]
fun test_mint_fee_based_fail_zero_fee() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_fee_based_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        0,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );
    ts::end(scenario); // Should not be reached
}

#[test]
fun test_mint_compound() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_compound_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        MAX_READS,
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );
    // Check shared object exists and owner cap exists
    let msg_ref = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
    assert_eq(message_module::get_owner(&msg_ref), OWNER);
    assert_eq(message_module::get_compound_collected_fees(&msg_ref), 0);
    assert_eq(message_module::get_compound_read_count(&msg_ref), 0);
    assert_eq(message_module::get_compound_remaining_reads(&msg_ref), MAX_READS);
    // Check policies embedded
    let tl_policy = message_module::get_compound_time_lock_policy(&msg_ref);
    assert_eq(policy_module::time_lock_policy_get_from(tl_policy), START_TIME);
    let lr_policy = message_module::get_compound_limited_read_policy(&msg_ref);
    assert_eq(policy_module::limited_read_policy_get_max(lr_policy), MAX_READS);
    let fb_policy = message_module::get_compound_fee_policy(&msg_ref);
    assert_eq(policy_module::fee_based_policy_get_fee_amount<SUI>(fb_policy), FEE_AMOUNT);
    assert_eq(policy_module::fee_based_policy_get_recipient<SUI>(fb_policy), RECIPIENT);

    let msg_id = object::id(&msg_ref);
    ts::return_shared(msg_ref);

    let cap = get_owner_cap(&scenario, OWNER, msg_id);
    return_owner_cap(&mut scenario, cap);
    ts::end(scenario);
}

// --- Reading Tests ---

// No Policy
#[test]
fun test_read_no_policy_success() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_no_policy_and_transfer(
        GROUP_ID,
        string_blob(),
        &clock,
        ctx(&mut scenario),
    );

    next_tx(&mut scenario, READER_1);
    let msg_ref = ts::take_shared<SuperMessageNoPolicy>(&scenario);
    message_module::read_message_no_policy(&msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Read again - should succeed
    let msg_ref = ts::take_shared<SuperMessageNoPolicy>(&scenario);
    message_module::read_message_no_policy(&msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    ts::end(scenario);
}

// Time Lock
#[test]
fun test_read_time_lock_success_in_window() {
    let (mut scenario, mut clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_time_lock_and_transfer(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        &clock,
        ctx(&mut scenario),
    );

    // Advance clock into window
    advance_ms(&mut clock, START_TIME - clock::timestamp_ms(&clock) + 50); // now = START_TIME + 50

    next_tx(&mut scenario, READER_1);
    let msg_ref = ts::take_shared<SuperMessageTimeLock>(&scenario);
    message_module::read_message_time_lock(&msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Read again - should succeed
    let msg_ref = ts::take_shared<SuperMessageTimeLock>(&scenario);
    message_module::read_message_time_lock(&msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ETimeLockNotYetActive)]
fun test_read_time_lock_fail_too_early() {
    let (mut scenario, clock) = setup_scenario(); // Clock starts before START_TIME
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_time_lock_and_transfer(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        &clock,
        ctx(&mut scenario),
    );

    next_tx(&mut scenario, READER_1);
    let msg_ref = ts::take_shared<SuperMessageTimeLock>(&scenario);
    message_module::read_message_time_lock(&msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref); // Should not reach here

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ETimeLockExpired)]
fun test_read_time_lock_fail_too_late() {
    let (mut scenario, mut clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_time_lock_and_transfer(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        &clock,
        ctx(&mut scenario),
    );

    // Advance clock past window
    advance_ms(&mut clock, END_TIME - clock::timestamp_ms(&clock) + 50); // now = END_TIME + 50

    next_tx(&mut scenario, READER_1);
    let msg_ref = ts::take_shared<SuperMessageTimeLock>(&scenario);
    message_module::read_message_time_lock(&msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref); // Should not reach here

    ts::end(scenario);
}

#[test]
fun test_read_time_lock_success_no_end_time() {
    let (mut scenario, mut clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_time_lock_and_transfer(
        GROUP_ID,
        string_blob(),
        START_TIME,
        0,
        &clock,
        ctx(&mut scenario), // to = 0
    );

    // Advance clock far past start time
    advance_ms(&mut clock, START_TIME - clock::timestamp_ms(&clock) + 50000);

    next_tx(&mut scenario, READER_1);
    let msg_ref = ts::take_shared<SuperMessageTimeLock>(&scenario);
    message_module::read_message_time_lock(&msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    ts::end(scenario);
}

// Limited Read (MAX_READS = 2)
#[test]
fun test_read_limited_read_success_and_limits() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_limited_read_and_transfer(
        GROUP_ID,
        string_blob(),
        MAX_READS,
        &clock,
        ctx(&mut scenario),
    );

    // Reader 1 reads (1st read)
    next_tx(&mut scenario, READER_1);
    let mut msg_ref = ts::take_shared<SuperMessageLimitedRead>(&scenario);
    message_module::read_message_limited_read(&mut msg_ref, &clock, ctx(&mut scenario));
    assert_eq(message_module::get_read_count(&msg_ref), 1);
    assert_eq(message_module::get_remaining_reads(&msg_ref), MAX_READS - 1);
    assert(vec_set::contains(message_module::get_readers(&msg_ref), &READER_1));
    ts::return_shared(msg_ref);

    // Reader 2 reads (2nd read)
    next_tx(&mut scenario, READER_2);
    let mut msg_ref = ts::take_shared<SuperMessageLimitedRead>(&scenario);
    message_module::read_message_limited_read(&mut msg_ref, &clock, ctx(&mut scenario));
    assert_eq(message_module::get_read_count(&msg_ref), 2);
    assert_eq(message_module::get_remaining_reads(&msg_ref), MAX_READS - 2);
    assert(vec_set::contains(message_module::get_readers(&msg_ref), &READER_2));
    ts::return_shared(msg_ref);

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = EAlreadyReadOrPaid)]
fun test_read_limited_read_fail_already_read() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_limited_read_and_transfer(
        GROUP_ID,
        string_blob(),
        MAX_READS,
        &clock,
        ctx(&mut scenario),
    );

    // Reader 1 reads (1st read)
    next_tx(&mut scenario, READER_1);
    let mut msg_ref = ts::take_shared<SuperMessageLimitedRead>(&scenario);
    message_module::read_message_limited_read(&mut msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Reader 1 tries to read again
    next_tx(&mut scenario, READER_1);
    let mut msg_ref = ts::take_shared<SuperMessageLimitedRead>(&scenario);
    message_module::read_message_limited_read(&mut msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref); // Should not reach here

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = EMaxReadsReached)]
fun test_read_limited_read_fail_max_reached() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_limited_read_and_transfer(
        GROUP_ID,
        string_blob(),
        MAX_READS,
        &clock,
        ctx(&mut scenario), // MAX_READS = 2
    );

    // Reader 1 reads
    next_tx(&mut scenario, READER_1);
    let mut msg_ref = ts::take_shared<SuperMessageLimitedRead>(&scenario);
    message_module::read_message_limited_read(&mut msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Reader 2 reads
    next_tx(&mut scenario, READER_2);
    let mut msg_ref = ts::take_shared<SuperMessageLimitedRead>(&scenario);
    message_module::read_message_limited_read(&mut msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Reader 3 tries to read
    next_tx(&mut scenario, READER_3);
    let mut msg_ref = ts::take_shared<SuperMessageLimitedRead>(&scenario);
    message_module::read_message_limited_read(&mut msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref); // Should not reach here

    ts::end(scenario);
}

// Fee Based (FEE_AMOUNT = 100)
#[test]
fun test_read_fee_based_success_exact_payment() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_fee_based_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );

    next_tx(&mut scenario, READER_1);
    let payment = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared<SuperMessageFeeBased<SUI>>(&scenario);

    message_module::read_message_fee_based<SUI>(&mut msg_ref, payment, &clock, ctx(&mut scenario));

    assert(vec_set::contains(message_module::get_fee_readers(&msg_ref), &READER_1));
    assert_eq(message_module::get_collected_fees(&msg_ref), PAYMENT_EXACT);
    ts::return_shared(msg_ref);

    ts::end(scenario);
}

#[test]
fun test_read_fee_based_success_more_payment() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_fee_based_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );

    next_tx(&mut scenario, READER_1);
    let payment = mint_test_sui(&mut scenario, READER_1, PAYMENT_MORE);
    let mut msg_ref = ts::take_shared<SuperMessageFeeBased<SUI>>(&scenario);

    message_module::read_message_fee_based<SUI>(&mut msg_ref, payment, &clock, ctx(&mut scenario));

    assert(vec_set::contains(message_module::get_fee_readers(&msg_ref), &READER_1));
    // Fee collected should be the actual amount paid
    assert_eq(message_module::get_collected_fees(&msg_ref), PAYMENT_MORE);
    ts::return_shared(msg_ref);

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = EInsufficientPayment)]
fun test_read_fee_based_fail_less_payment() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_fee_based_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );

    next_tx(&mut scenario, READER_1);
    let payment = mint_test_sui(&mut scenario, READER_1, PAYMENT_LESS);
    let mut msg_ref = ts::take_shared<SuperMessageFeeBased<SUI>>(&scenario);

    message_module::read_message_fee_based<SUI>(&mut msg_ref, payment, &clock, ctx(&mut scenario));

    ts::return_shared(msg_ref); // Should not reach here
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = EAlreadyReadOrPaid)]
fun test_read_fee_based_fail_already_paid() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_fee_based_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );

    // First successful read
    next_tx(&mut scenario, READER_1);
    let payment1 = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared<SuperMessageFeeBased<SUI>>(&scenario);
    message_module::read_message_fee_based<SUI>(&mut msg_ref, payment1, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Try to read again
    next_tx(&mut scenario, READER_1);
    let payment2 = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared<SuperMessageFeeBased<SUI>>(&scenario);
    message_module::read_message_fee_based<SUI>(&mut msg_ref, payment2, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref); // Should not reach here

    ts::end(scenario);
}

// Compound (TL: 1000-2000, LR: 2, Fee: 100)
#[test]
fun test_read_compound_success() {
    let (mut scenario, mut clock) = setup_scenario(); // Starts at 990
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_compound_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        MAX_READS,
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );

    // Advance into time window
    advance_ms(&mut clock, START_TIME - clock::timestamp_ms(&clock) + 100); // Now = 1100

    // Reader 1 reads successfully
    next_tx(&mut scenario, READER_1);
    let payment1 = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
    message_module::read_message_compound<SUI>(&mut msg_ref, payment1, &clock, ctx(&mut scenario));
    assert_eq(message_module::get_compound_read_count(&msg_ref), 1);
    assert_eq(message_module::get_compound_collected_fees(&msg_ref), PAYMENT_EXACT);
    assert(vec_set::contains(message_module::get_compound_readers(&msg_ref), &READER_1));
    ts::return_shared(msg_ref);

    // Reader 2 reads successfully
    next_tx(&mut scenario, READER_2);
    let payment2 = mint_test_sui(&mut scenario, READER_2, PAYMENT_MORE);
    let mut msg_ref = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
    message_module::read_message_compound<SUI>(&mut msg_ref, payment2, &clock, ctx(&mut scenario));
    assert_eq(message_module::get_compound_read_count(&msg_ref), 2);
    assert_eq(message_module::get_compound_collected_fees(&msg_ref), PAYMENT_EXACT + PAYMENT_MORE);
    assert(vec_set::contains(message_module::get_compound_readers(&msg_ref), &READER_2));
    ts::return_shared(msg_ref);

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ETimeLockNotYetActive)]
fun test_read_compound_fail_too_early() {
    let (mut scenario, clock) = setup_scenario(); // Starts at 990
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_compound_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        MAX_READS,
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );

    // Try read before START_TIME
    next_tx(&mut scenario, READER_1);
    let payment = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
    message_module::read_message_compound<SUI>(&mut msg_ref, payment, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref); // Fail

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ETimeLockExpired)]
fun test_read_compound_fail_too_late() {
    let (mut scenario, mut clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_compound_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        MAX_READS,
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );

    // Advance past END_TIME
    advance_ms(&mut clock, END_TIME - clock::timestamp_ms(&clock) + 100); // Now = 2100

    next_tx(&mut scenario, READER_1);
    let payment = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
    message_module::read_message_compound<SUI>(&mut msg_ref, payment, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref); // Fail

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = EMaxReadsReached)]
fun test_read_compound_fail_max_reads() {
    let (mut scenario, mut clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_compound_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        MAX_READS,
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario), // MAX_READS = 2
    );

    advance_ms(&mut clock, START_TIME - clock::timestamp_ms(&clock) + 100); // Enter window

    // Reader 1 reads
    next_tx(&mut scenario, READER_1);
    let payment1 = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
    message_module::read_message_compound<SUI>(&mut msg_ref, payment1, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Reader 2 reads
    next_tx(&mut scenario, READER_2);
    let payment2 = mint_test_sui(&mut scenario, READER_2, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
    message_module::read_message_compound<SUI>(&mut msg_ref, payment2, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Reader 3 tries to read
    next_tx(&mut scenario, READER_3);
    let payment3 = mint_test_sui(&mut scenario, READER_3, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
    message_module::read_message_compound<SUI>(&mut msg_ref, payment3, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref); // Fail

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = EInsufficientPayment)]
fun test_read_compound_fail_low_fee() {
    let (mut scenario, mut clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_compound_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        MAX_READS,
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );

    advance_ms(&mut clock, START_TIME - clock::timestamp_ms(&clock) + 100); // Enter window

    // Reader 1 tries with less payment
    next_tx(&mut scenario, READER_1);
    let payment = mint_test_sui(&mut scenario, READER_1, PAYMENT_LESS);
    let mut msg_ref = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
    message_module::read_message_compound<SUI>(&mut msg_ref, payment, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref); // Fail

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = EAlreadyReadOrPaid)]
fun test_read_compound_fail_already_paid() {
    let (mut scenario, mut clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_compound_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        MAX_READS,
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );

    advance_ms(&mut clock, START_TIME - clock::timestamp_ms(&clock) + 100); // Enter window

    // Reader 1 reads successfully
    next_tx(&mut scenario, READER_1);
    let payment1 = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
    message_module::read_message_compound<SUI>(&mut msg_ref, payment1, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Reader 1 tries again
    next_tx(&mut scenario, READER_1);
    let payment2 = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
    message_module::read_message_compound<SUI>(&mut msg_ref, payment2, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref); // Fail

    ts::end(scenario);
}

// --- Withdrawal Tests ---

#[test]
fun test_withdraw_fee_based_success() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_fee_based_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );
    let msg_id = ts::most_recent_object_id(&scenario); // Get ID of the minted message

    // Reader 1 pays
    next_tx(&mut scenario, READER_1);
    let payment = mint_test_sui(&mut scenario, READER_1, PAYMENT_MORE); // Pay 150
    let mut msg_ref = ts::take_shared_by_id<SuperMessageFeeBased<SUI>>(&scenario, msg_id);
    message_module::read_message_fee_based<SUI>(&mut msg_ref, payment, &clock, ctx(&mut scenario));
    assert_eq(message_module::get_collected_fees(&msg_ref), PAYMENT_MORE);
    ts::return_shared(msg_ref);

    // Owner withdraws
    next_tx(&mut scenario, OWNER);
    let cap = get_owner_cap(&scenario, OWNER, msg_id);
    let mut msg_ref = ts::take_shared_by_id<SuperMessageFeeBased<SUI>>(&scenario, msg_id);
    let recipient_initial_balance = ts::balance<SUI>(&scenario, RECIPIENT);

    message_module::withdraw_fees<SUI>(&mut msg_ref, &cap, ctx(&mut scenario));

    assert_eq(message_module::get_collected_fees(&msg_ref), 0); // Fees should be zero now
    // Check recipient balance increased (exact check is tricky due to gas, check > initial)
    assert(ts::balance<SUI>(&scenario, RECIPIENT) == recipient_initial_balance + PAYMENT_MORE);

    ts::return_shared(msg_ref);
    return_owner_cap(&mut scenario, cap);

    ts::end(scenario);
}

#[test]
fun test_withdraw_compound_success() {
    let (mut scenario, mut clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_compound_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        MAX_READS,
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );
    let msg_id = ts::most_recent_object_id(&scenario);

    advance_ms(&mut clock, START_TIME - clock::timestamp_ms(&clock) + 100); // Enter window

    // Reader 1 pays
    next_tx(&mut scenario, READER_1);
    let payment = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared_by_id<SuperMessageCompound<SUI>>(&scenario, msg_id);
    message_module::read_message_compound<SUI>(&mut msg_ref, payment, &clock, ctx(&mut scenario));
    assert_eq(message_module::get_compound_collected_fees(&msg_ref), PAYMENT_EXACT);
    ts::return_shared(msg_ref);

    // Owner withdraws
    next_tx(&mut scenario, OWNER);
    let cap = get_owner_cap(&scenario, OWNER, msg_id);
    let mut msg_ref = ts::take_shared_by_id<SuperMessageCompound<SUI>>(&scenario, msg_id);
    let recipient_initial_balance = ts::balance<SUI>(&scenario, RECIPIENT);

    message_module::withdraw_fees_compound<SUI>(&mut msg_ref, &cap, ctx(&mut scenario));

    assert_eq(message_module::get_compound_collected_fees(&msg_ref), 0);
    assert(ts::balance<SUI>(&scenario, RECIPIENT) == recipient_initial_balance + PAYMENT_EXACT);

    ts::return_shared(msg_ref);
    return_owner_cap(&mut scenario, cap);

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ENoFeesToWithdraw)]
fun test_withdraw_fail_no_fees() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_fee_based_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );
    let msg_id = ts::most_recent_object_id(&scenario);

    // Owner tries to withdraw immediately
    next_tx(&mut scenario, OWNER);
    let cap = get_owner_cap(&scenario, OWNER, msg_id);
    let mut msg_ref = ts::take_shared_by_id<SuperMessageFeeBased<SUI>>(&scenario, msg_id);

    message_module::withdraw_fees<SUI>(&mut msg_ref, &cap, ctx(&mut scenario)); // Fail

    ts::return_shared(msg_ref);
    return_owner_cap(&mut scenario, cap);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ENotMessageOwner)]
fun test_withdraw_fail_not_owner_sender() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_fee_based_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );
    let msg_id = ts::most_recent_object_id(&scenario);

    // Reader 1 pays to have some fees
    next_tx(&mut scenario, READER_1);
    let payment = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg_ref = ts::take_shared_by_id<SuperMessageFeeBased<SUI>>(&scenario, msg_id);
    message_module::read_message_fee_based<SUI>(&mut msg_ref, payment, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Other user (not owner) tries to withdraw, even if they somehow got the cap
    // First, transfer cap to OTHER_USER (simulating compromised account/theft)
    next_tx(&mut scenario, OWNER);
    let cap = get_owner_cap(&scenario, OWNER, msg_id);
    ts::transfer_to_address(&mut scenario, cap, OTHER_USER);

    next_tx(&mut scenario, OTHER_USER); // Now OTHER_USER is the sender
    let cap_other = ts::take_owned_by_sender<MessageOwnerCap>(&scenario); // Take the cap back
    let mut msg_ref = ts::take_shared_by_id<SuperMessageFeeBased<SUI>>(&scenario, msg_id);

    // This should fail because sender (OTHER_USER) != message.owner (OWNER)
    message_module::withdraw_fees<SUI>(&mut msg_ref, &cap_other, ctx(&mut scenario));

    ts::return_shared(msg_ref);
    ts::return_owned(scenario, cap_other); // Return the cap
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ENotMessageOwner)]
fun test_withdraw_fail_wrong_cap() {
    let (mut scenario, clock) = setup_scenario();
    // Mint message 1
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_fee_based_and_transfer<SUI>(
        GROUP_ID,
        string_blob(),
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );
    let msg1_id = ts::most_recent_object_id(&scenario);

    // Reader 1 pays message 1
    next_tx(&mut scenario, READER_1);
    let payment1 = mint_test_sui(&mut scenario, READER_1, PAYMENT_EXACT);
    let mut msg1_ref = ts::take_shared_by_id<SuperMessageFeeBased<SUI>>(&scenario, msg1_id);
    message_module::read_message_fee_based<SUI>(
        &mut msg1_ref,
        payment1,
        &clock,
        ctx(&mut scenario),
    );
    ts::return_shared(msg1_ref);

    // Mint message 2
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_fee_based_and_transfer<SUI>(
        GROUP_ID,
        utf8(b"blob2"),
        FEE_AMOUNT,
        RECIPIENT,
        &clock,
        ctx(&mut scenario),
    );
    let msg2_id = ts::most_recent_object_id(&scenario);

    // Owner tries to withdraw from message 1 using cap for message 2
    next_tx(&mut scenario, OWNER);
    let cap2 = get_owner_cap(&scenario, OWNER, msg2_id); // Cap for message 2
    let mut msg1_ref = ts::take_shared_by_id<SuperMessageFeeBased<SUI>>(&scenario, msg1_id); // Message 1 ref

    message_module::withdraw_fees<SUI>(&mut msg1_ref, &cap2, ctx(&mut scenario)); // Should fail

    ts::return_shared(msg1_ref);
    return_owner_cap(&mut scenario, cap2);
    // Clean up cap1
    let cap1 = get_owner_cap(&scenario, OWNER, msg1_id);
    return_owner_cap(&mut scenario, cap1);

    ts::end(scenario);
}

// --- Seal Tests ---
// Note: Seal tests might require more complex setup depending on the 'is_prefix' logic
// Assuming is_prefix checks if the provided ID is a prefix of the message ID bytes.

#[test]
fun test_seal_approve_time_lock_success() {
    let (mut scenario, mut clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_time_lock_and_transfer(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        &clock,
        ctx(&mut scenario),
    );
    let msg_id = ts::most_recent_object_id(&scenario);
    let msg_id_bytes = object::id_to_bytes(msg_id);

    advance_ms(&mut clock, START_TIME - clock::timestamp_ms(&clock) + 50); // Enter window

    next_tx(&mut scenario, OTHER_USER); // Anyone can call seal approve
    let msg_ref = ts::take_shared_by_id<SuperMessageTimeLock>(&scenario, msg_id);
    // Use the full ID as prefix (should always work)
    message_module::seal_approve_super_message_time_lock(
        msg_id_bytes,
        &msg_ref,
        &clock,
        ctx(&mut scenario),
    );
    ts::return_shared(msg_ref);

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ESealApprovalFailed)]
fun test_seal_approve_time_lock_fail_time() {
    let (mut scenario, clock) = setup_scenario(); // Clock is before START_TIME
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_time_lock_and_transfer(
        GROUP_ID,
        string_blob(),
        START_TIME,
        END_TIME,
        &clock,
        ctx(&mut scenario),
    );
    let msg_id = ts::most_recent_object_id(&scenario);
    let msg_id_bytes = object::id_to_bytes(msg_id);

    next_tx(&mut scenario, OTHER_USER);
    let msg_ref = ts::take_shared_by_id<SuperMessageTimeLock>(&scenario, msg_id);
    message_module::seal_approve_super_message_time_lock(
        msg_id_bytes,
        &msg_ref,
        &clock,
        ctx(&mut scenario),
    ); // Fail due to time
    ts::return_shared(msg_ref);

    ts::end(scenario);
}

#[test]
fun test_seal_approve_limited_read_success() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_limited_read_and_transfer(
        GROUP_ID,
        string_blob(),
        MAX_READS,
        &clock,
        ctx(&mut scenario), // MAX_READS = 2
    );
    let msg_id = ts::most_recent_object_id(&scenario);
    let msg_id_bytes = object::id_to_bytes(msg_id);

    // Reader 1 reads (uses 1 slot)
    next_tx(&mut scenario, READER_1);
    let mut msg_ref = ts::take_shared_by_id<SuperMessageLimitedRead>(&scenario, msg_id);
    message_module::read_message_limited_read(&mut msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Seal approve should succeed as slots are available (1 < 2)
    next_tx(&mut scenario, OTHER_USER);
    let msg_ref = ts::take_shared_by_id<SuperMessageLimitedRead>(&scenario, msg_id);
    message_module::seal_approve_super_message_limited_read(
        msg_id_bytes,
        &msg_ref,
        ctx(&mut scenario),
    );
    ts::return_shared(msg_ref);

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ESealApprovalFailed)]
fun test_seal_approve_limited_read_fail_max_reached() {
    let (mut scenario, clock) = setup_scenario();
    next_tx(&mut scenario, OWNER);
    message_module::mint_super_message_limited_read_and_transfer(
        GROUP_ID,
        string_blob(),
        MAX_READS,
        &clock,
        ctx(&mut scenario), // MAX_READS = 2
    );
    let msg_id = ts::most_recent_object_id(&scenario);
    let msg_id_bytes = object::id_to_bytes(msg_id);

    // Reader 1 reads
    next_tx(&mut scenario, READER_1);
    let mut msg_ref = ts::take_shared_by_id<SuperMessageLimitedRead>(&scenario, msg_id);
    message_module::read_message_limited_read(&mut msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Reader 2 reads
    next_tx(&mut scenario, READER_2);
    let mut msg_ref = ts::take_shared_by_id<SuperMessageLimitedRead>(&scenario, msg_id);
    message_module::read_message_limited_read(&mut msg_ref, &clock, ctx(&mut scenario));
    ts::return_shared(msg_ref);

    // Seal approve should fail now (2 >= 2)
    next_tx(&mut scenario, OTHER_USER);
    let msg_ref = ts::take_shared_by_id<SuperMessageLimitedRead>(&scenario, msg_id);
    message_module::seal_approve_super_message_limited_read(
        msg_id_bytes,
        &msg_ref,
        ctx(&mut scenario),
    ); // Fail
    ts::return_shared(msg_ref);

    ts::end(scenario);
}

// Add similar tests for seal_approve_super_message_compound success and failure
// Test seal failure due to incorrect prefix_id as well if is_prefix logic is complex
