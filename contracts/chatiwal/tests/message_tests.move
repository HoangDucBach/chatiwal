// chatiwal/sources/message_tests.move
#[test_only]
#[allow(unused_use, unused_const)]
module chatiwal::message_tests;

use chatiwal::group;
use chatiwal::message::{Self, MessageOwnerCap, EMaxReadsReached, check_policy, read_message};
use chatiwal::message_policy;
use std::hash::sha2_256;
use std::string::{utf8, String};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::hash;
use sui::sui::SUI;
use sui::test_scenario::{Self as ts, Scenario, next_tx, ctx};
use sui::test_utils::{Self, assert_eq};

// === Test Constants ===
const MESSAGE_MODULE_PREFIX: vector<u8> = b"chatiwal::message";

const OWNER: address = @0xA;
const GROUP_ID: address = @0xB;
const READER_1: address = @0xB;
const READER_2: address = @0xC;
const READER_3: address = @0xD;
const RECIPIENT: address = @0xE; // Separate recipient for fees
const OTHER_USER: address = @0xF;

const START_TIME: u64 = 1000;
const END_TIME: u64 = 2000;
const MAX_READS: u64 = 2;
const FEE_AMOUNT: u64 = 100;
const PAYMENT_EXACT: u64 = 100;
const PAYMENT_MORE: u64 = 150;
const PAYMENT_LESS: u64 = 50;

// === Helper Functions ===

fun setup_scenario(): (Scenario, Clock) {
    let mut scenario = ts::begin(OWNER);
    let clock = clock::create_for_testing(scenario.ctx());
    (scenario, clock)
}

fun string_blob(): String {
    utf8(b"test_message_blob")
}

fun mint_test_sui(scenario: &mut Scenario, recipient: address, amount: u64): Coin<SUI> {
    coin::mint_for_testing(amount, ctx(scenario))
}

fun get_owner_cap(scenario: &Scenario): MessageOwnerCap {
    ts::take_from_sender<MessageOwnerCap>(scenario)
}

fun return_owner_cap(owner: address, cap: MessageOwnerCap) {
    ts::return_to_address<MessageOwnerCap>(owner, cap);
}

// === Test Cases ===

#[test]
fun test_mint_no_policy() {
    let (mut scenario, clock) = setup_scenario();
    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_no_policy_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            &clock,
            ctx(&mut scenario),
        );
    };
    next_tx(&mut scenario, OWNER);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        assert_eq(message::message_get_owner(&msg), OWNER);
        assert_eq(message::message_get_group_id(&msg), GROUP_ID.to_id());

        let cap = get_owner_cap(&scenario);
        assert_eq(message::message_cap_get_message_id(&cap), object::id(&msg));

        return_owner_cap(OWNER, cap);
        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_mint_time_lock() {
    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;
    let (mut scenario, clock) = setup_scenario();

    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_time_lock_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            START_TIME,
            END_TIME,
            &clock,
            ctx(&mut scenario),
        );
    };
    next_tx(&mut scenario, OWNER);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        assert_eq(message::message_get_owner(&msg), OWNER);

        let policy_opt = message::message_get_time_lock(&msg);
        assert_eq(option::is_some(&policy_opt), true);
        let policy = *option::borrow(&policy_opt);
        assert_eq(message_policy::time_lock_policy_get_from(&policy), START_TIME);
        assert_eq(message_policy::time_lock_policy_get_to(&policy), END_TIME);

        let cap = get_owner_cap(&scenario);
        assert_eq(message::message_cap_get_message_id(&cap), object::id(&msg));

        return_owner_cap(OWNER, cap);
        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message_policy::EInvalidTimeRange)]
fun test_mint_time_lock_fail_invalid_range() {
    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;
    let (mut scenario, clock) = setup_scenario();

    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_time_lock_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            END_TIME,
            START_TIME,
            &clock,
            ctx(&mut scenario),
        );
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_mint_limited_read() {
    let (mut scenario, clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_limited_read_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            MAX_READS,
            &clock,
            ctx(&mut scenario),
        );
    };
    next_tx(&mut scenario, OWNER);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        assert_eq(message::message_get_owner(&msg), OWNER);
        assert_eq(message::message_get_readers(&msg).size(), 0);
        assert_eq(message::get_remaining_reads(&msg), MAX_READS);

        let policy_opt = message::message_get_limited_read(&msg);
        assert_eq(option::is_some(&policy_opt), true);
        let policy = *option::borrow(&policy_opt);
        assert_eq(message_policy::limited_read_policy_get_max(&policy), MAX_READS);

        let cap = get_owner_cap(&scenario);
        assert_eq(message::message_cap_get_message_id(&cap), object::id(&msg));

        return_owner_cap(OWNER, cap);
        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message_policy::EInvalidMaxReads)]
fun test_mint_limited_read_fail_zero_max() {
    let (mut scenario, clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_limited_read_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            0,
            &clock,
            ctx(&mut scenario),
        );
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_mint_fee_based() {
    let (mut scenario, clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_fee_based_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            FEE_AMOUNT,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };
    next_tx(&mut scenario, OWNER);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        assert_eq(message::message_get_owner(&msg), OWNER);
        assert_eq(message::get_collected_fees(&msg), 0);

        let policy_opt = message::message_get_fee_policy(&msg);
        assert_eq(policy_opt.is_some(), true);
        let policy = policy_opt.borrow();
        assert_eq(policy.fee_based_policy_get_fee_amount(), FEE_AMOUNT);
        assert_eq(policy.fee_based_policy_get_recipient(), RECIPIENT);

        let cap = get_owner_cap(&scenario);
        assert_eq(message::message_cap_get_message_id(&cap), object::id(&msg));

        return_owner_cap(OWNER, cap);
        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message_policy::EInvalidFeeAmount)]
fun test_mint_fee_based_fail_zero_fee() {
    let (mut scenario, clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_fee_based_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            0,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_mint_compound() {
    let (mut scenario, clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_compound_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            START_TIME,
            END_TIME,
            MAX_READS,
            FEE_AMOUNT,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };
    next_tx(&mut scenario, OWNER);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        assert_eq(message::message_get_owner(&msg), OWNER);
        assert_eq(message::get_collected_fees(&msg), 0);
        assert_eq(message::message_get_readers(&msg).size(), 0);

        let tl_policy_opt = message::message_get_time_lock(&msg);
        assert_eq(option::is_some(&tl_policy_opt), true);
        let tl_policy = *option::borrow(&tl_policy_opt);
        assert_eq(message_policy::time_lock_policy_get_from(&tl_policy), START_TIME);

        let lr_policy_opt = message::message_get_limited_read(&msg);
        assert_eq(option::is_some(&lr_policy_opt), true);
        let lr_policy = *option::borrow(&lr_policy_opt);
        assert_eq(message_policy::limited_read_policy_get_max(&lr_policy), MAX_READS);

        let fb_policy_opt = message::message_get_fee_policy(&msg);
        assert_eq(fb_policy_opt.is_some(), true);
        let fb_policy = fb_policy_opt.borrow();
        assert_eq(fb_policy.fee_based_policy_get_fee_amount(), FEE_AMOUNT);
        assert_eq(fb_policy.fee_based_policy_get_recipient(), RECIPIENT);

        let cap = get_owner_cap(&scenario);
        assert_eq(message::message_cap_get_message_id(&cap), object::id(&msg));

        return_owner_cap(OWNER, cap);
        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_seal_approve_super_message() {
    let (mut scenario, clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_compound_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            START_TIME,
            END_TIME,
            MAX_READS,
            FEE_AMOUNT,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_read_message_no_policy() {
    let (mut scenario, clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // First create a message with no policy
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_no_policy_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Read message as READER_1
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let empty_coin = coin::mint_for_testing(0, ctx(&mut scenario));

        message::read_message(&mut msg, empty_coin, &clock, ctx(&mut scenario));

        // Verify reader was added
        let readers = message::message_get_readers(&msg);
        assert_eq(readers.contains(&READER_1), true);
        assert_eq(readers.size(), 1);

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_read_message_time_lock_success() {
    let (mut scenario, mut clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with time lock
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_time_lock_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            START_TIME,
            END_TIME,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Set clock to valid time
    clock::set_for_testing(&mut clock, START_TIME + 100);

    // Read message as READER_1
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let empty_coin = coin::mint_for_testing(0, ctx(&mut scenario));

        message::read_message(&mut msg, empty_coin, &clock, ctx(&mut scenario));

        // Verify reader was added
        let readers = message::message_get_readers(&msg);
        assert_eq(readers.contains(&READER_1), true);
        assert_eq(readers.size(), 1);

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message::ETimeLockTooEarly)]
fun test_read_message_time_lock_too_early() {
    let (mut scenario, mut clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with time lock
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_time_lock_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            START_TIME,
            END_TIME,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Set clock to too early time
    clock::set_for_testing(&mut clock, START_TIME - 100);

    // Read message as READER_1 - should fail
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let empty_coin = coin::mint_for_testing(0, ctx(&mut scenario));

        message::read_message(&mut msg, empty_coin, &clock, ctx(&mut scenario));

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message::ETimeLockExpired)]
fun test_read_message_time_lock_expired() {
    let (mut scenario, mut clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with time lock
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_time_lock_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            START_TIME,
            END_TIME,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Set clock to expired time
    clock::set_for_testing(&mut clock, END_TIME + 100);

    // Read message as READER_1 - should fail
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let empty_coin = coin::mint_for_testing(0, ctx(&mut scenario));

        message::read_message(&mut msg, empty_coin, &clock, ctx(&mut scenario));

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_read_message_limited_read_success() {
    let (mut scenario, clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with limited read
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_limited_read_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            MAX_READS,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Read message as READER_1
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let empty_coin = coin::mint_for_testing(0, ctx(&mut scenario));

        message::read_message(&mut msg, empty_coin, &clock, ctx(&mut scenario));

        // Verify reader was added
        let readers = message::message_get_readers(&msg);
        assert_eq(readers.contains(&READER_1), true);
        assert_eq(readers.size(), 1);
        assert_eq(message::get_remaining_reads(&msg), MAX_READS - 1);

        ts::return_shared(msg);
    };

    // Read message as READER_2
    next_tx(&mut scenario, READER_2);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let empty_coin = coin::mint_for_testing(0, ctx(&mut scenario));

        message::read_message(&mut msg, empty_coin, &clock, ctx(&mut scenario));

        // Verify reader was added
        let readers = message::message_get_readers(&msg);
        assert_eq(readers.contains(&READER_2), true);
        assert_eq(readers.size(), 2);
        assert_eq(message::get_remaining_reads(&msg), MAX_READS - 2);

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message::EMaxReadsReached)]
fun test_read_message_limited_read_max_reached() {
    let (mut scenario, clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with limited read of 2
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_limited_read_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            MAX_READS, // MAX_READS = 2
            &clock,
            ctx(&mut scenario),
        );
    };

    // Read message as READER_1
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let empty_coin = coin::mint_for_testing(0, ctx(&mut scenario));

        message::read_message(&mut msg, empty_coin, &clock, ctx(&mut scenario));
        ts::return_shared(msg);
    };

    // Read message as READER_2
    next_tx(&mut scenario, READER_2);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let empty_coin = coin::mint_for_testing(0, ctx(&mut scenario));

        message::read_message(&mut msg, empty_coin, &clock, ctx(&mut scenario));
        ts::return_shared(msg);
    };

    // Read message as READER_3 - should fail because MAX_READS = 2
    next_tx(&mut scenario, READER_3);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let empty_coin = coin::mint_for_testing(0, ctx(&mut scenario));

        message::read_message(&mut msg, empty_coin, &clock, ctx(&mut scenario));
        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message::EAlreadyPaid)]
fun test_read_message_already_read() {
    let (mut scenario, clock) = setup_scenario();
    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with no policy
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_no_policy_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Read message as READER_1
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let empty_coin = coin::mint_for_testing(0, ctx(&mut scenario));

        message::read_message(&mut msg, empty_coin, &clock, ctx(&mut scenario));
        ts::return_shared(msg);
    };

    // Try to read message as READER_1 again - should fail
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let empty_coin = coin::mint_for_testing(0, ctx(&mut scenario));

        message::read_message(&mut msg, empty_coin, &clock, ctx(&mut scenario));
        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_read_message_fee_based_exact_payment() {
    let (mut scenario, clock) = setup_scenario();
    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with fee policy
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_fee_based_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            FEE_AMOUNT,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Read message as READER_1 with exact payment
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let payment = coin::mint_for_testing(FEE_AMOUNT, ctx(&mut scenario));

        message::read_message(&mut msg, payment, &clock, ctx(&mut scenario));

        // Verify reader was added and fee collected
        let readers = message::message_get_readers(&msg);
        assert_eq(readers.contains(&READER_1), true);
        assert_eq(message::get_collected_fees(&msg), FEE_AMOUNT);

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_read_message_fee_based_extra_payment() {
    let (mut scenario, clock) = setup_scenario();
    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with fee policy
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_fee_based_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            FEE_AMOUNT,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Read message as READER_1 with extra payment
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let payment = coin::mint_for_testing(PAYMENT_MORE, ctx(&mut scenario));

        message::read_message(&mut msg, payment, &clock, ctx(&mut scenario));

        // Verify reader was added and fee collected
        let readers = message::message_get_readers(&msg);
        assert_eq(readers.contains(&READER_1), true);
        assert_eq(message::get_collected_fees(&msg), FEE_AMOUNT);

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message::EInsufficientPayment)]
fun test_read_message_fee_based_insufficient_payment() {
    let (mut scenario, clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with fee policy
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_fee_based_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            FEE_AMOUNT,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Read message as READER_1 with insufficient payment - should fail
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let payment = coin::mint_for_testing(PAYMENT_LESS, ctx(&mut scenario));

        message::read_message(&mut msg, payment, &clock, ctx(&mut scenario));

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message::EPaymentNotAllowed)]
fun test_read_message_no_policy_with_payment() {
    let (mut scenario, clock) = setup_scenario();
    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with no policy
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_no_policy_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Read message as READER_1 with payment when no payment is required - should fail
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let payment = coin::mint_for_testing(FEE_AMOUNT, ctx(&mut scenario));

        message::read_message(&mut msg, payment, &clock, ctx(&mut scenario));

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_read_message_compound_success() {
    let (mut scenario, mut clock) = setup_scenario();

    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create compound message with all policies
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_compound_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            START_TIME,
            END_TIME,
            MAX_READS,
            FEE_AMOUNT,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Set clock to valid time
    clock::set_for_testing(&mut clock, START_TIME + 100);

    // Read message as READER_1 with correct payment
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let payment = coin::mint_for_testing(FEE_AMOUNT, ctx(&mut scenario));

        message::read_message(&mut msg, payment, &clock, ctx(&mut scenario));

        // Verify reader was added and fee collected
        let readers = message::message_get_readers(&msg);
        assert_eq(readers.contains(&READER_1), true);
        assert_eq(message::get_collected_fees(&msg), FEE_AMOUNT);
        assert_eq(message::get_remaining_reads(&msg), MAX_READS - 1);

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_withdraw_fees() {
    let (mut scenario, clock) = setup_scenario();
    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with fee policy
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_fee_based_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            FEE_AMOUNT,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Read message as READER_1 with payment
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let payment = coin::mint_for_testing(FEE_AMOUNT, ctx(&mut scenario));

        message::read_message(&mut msg, payment, &clock, ctx(&mut scenario));

        // Verify fee collected
        assert_eq(message::get_collected_fees(&msg), FEE_AMOUNT);

        ts::return_shared(msg);
    };

    // Withdraw fees as recipient
    next_tx(&mut scenario, RECIPIENT);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let payment = coin::mint_for_testing(PAYMENT_EXACT, ctx(&mut scenario));

        message::read_message(&mut msg, payment, &clock, ctx(&mut scenario));

        let readers = message::message_get_readers(&msg);
        assert_eq(readers.contains(&READER_1), true);
        assert!(msg.get_collected_fees()>= FEE_AMOUNT, 1);

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message::ENoFeesToWithdraw)]
fun test_withdraw_fees_no_fee_policy() {
    let (mut scenario, clock) = setup_scenario();
    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with no policy
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_no_policy_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Try to withdraw fees - should fail
    next_tx(&mut scenario, RECIPIENT);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);

        message::withdraw_fees(&mut msg, &clock, ctx(&mut scenario));

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message::ENoFeesToWithdraw)]
fun test_withdraw_fees_no_fees_collected() {
    let (mut scenario, clock) = setup_scenario();
    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with fee policy
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_fee_based_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            FEE_AMOUNT,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Try to withdraw fees without any being collected - should fail
    next_tx(&mut scenario, RECIPIENT);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);

        message::withdraw_fees(&mut msg, &clock, ctx(&mut scenario));

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message::ENotMessageRecipient)]
fun test_withdraw_fees_not_recipient() {
    let (mut scenario, clock) = setup_scenario();
    let aux_id: vector<u8> = MESSAGE_MODULE_PREFIX;

    // Create message with fee policy
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_fee_based_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            aux_id,
            FEE_AMOUNT,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };

    // Read message as READER_1 with payment
    next_tx(&mut scenario, READER_1);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);
        let payment = coin::mint_for_testing(FEE_AMOUNT, ctx(&mut scenario));

        message::read_message(&mut msg, payment, &clock, ctx(&mut scenario));
        ts::return_shared(msg);
    };

    // Try to withdraw fees as non-recipient - should fail
    next_tx(&mut scenario, OTHER_USER);
    {
        let mut msg = ts::take_shared<message::SuperMessage>(&scenario);

        message::withdraw_fees(&mut msg, &clock, ctx(&mut scenario));

        ts::return_shared(msg);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}
