// chatiwal/sources/message_tests.move
#[test_only]
#[allow(unused_use, unused_const)]
module chatiwal::message_tests;

use chatiwal::group;
use chatiwal::message::{
    Self,
    SuperMessageNoPolicy,
    SuperMessageTimeLock,
    SuperMessageLimitedRead,
    SuperMessageFeeBased,
    SuperMessageCompound,
    MessageOwnerCap,
    EMaxReadsReached
};
use chatiwal::message_policy;
use std::string::{utf8, String};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::test_scenario::{Self as ts, Scenario, next_tx, ctx};
use sui::test_utils::{Self, assert_eq};

// === Test Constants ===
const OWNER: address = @0xA;
const GROUP_ID: address = @0xB;
const READER_1: address = @0xB;
const READER_2: address = @0xC;
const READER_3: address = @0xD;
const RECIPIENT: address = @0xE; // Separate recipient for fees
const OTHER_USER: address = @0xF;

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
    let mut scenario = ts::begin(OWNER);
    let clock = clock::create_for_testing(scenario.ctx());
    (scenario, clock)
}

fun string_blob(): String {
    utf8(BLOB_ID)
}

fun mint_test_sui(scenario: &mut Scenario, recipient: address, amount: u64): Coin<SUI> {
    let coin = coin::mint_for_testing<SUI>(amount, scenario.ctx());
    // Need to explicitly transfer if recipient != current sender
    // For simplicity in tests, usually mint for the current sender or manage transfers explicitly
    coin // Assuming minted for current sender unless transferred
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

    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_no_policy_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            &clock,
            ctx(&mut scenario),
        );
    };
    next_tx(&mut scenario, OWNER);
    {
        let msg = ts::take_shared<SuperMessageNoPolicy>(&scenario);
        assert_eq(msg.message_no_policy_get_owner(), OWNER);
        assert_eq(msg.message_no_policy_get_group_id(), GROUP_ID.to_id());

        let cap = get_owner_cap(&scenario);
        assert_eq(cap.message_cap_get_message_id(), object::id(&msg));

        return_owner_cap(OWNER, cap);
        ts::return_shared(msg);
    };

    clock.destroy_for_testing();
    ts::end(scenario);
}

#[test]
fun test_mint_time_lock() {
    let (mut scenario, clock) = setup_scenario();

    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_time_lock_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            START_TIME,
            END_TIME,
            &clock,
            ctx(&mut scenario),
        );
    };
    next_tx(&mut scenario, OWNER);
    {
        let msg = ts::take_shared<SuperMessageTimeLock>(&scenario);
        assert_eq(msg.message_time_lock_get_owner(), OWNER);
        
        let policy = msg.message_time_lock_get_policy();
        assert_eq(message_policy::time_lock_policy_get_from(&policy), START_TIME);
        assert_eq(message_policy::time_lock_policy_get_to(&policy), END_TIME);
        
        let cap = get_owner_cap(&scenario);
        assert_eq(cap.message_cap_get_message_id(), object::id(&msg));
        
        return_owner_cap(OWNER, cap);
        ts::return_shared(msg);
    };

    clock.destroy_for_testing();
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::chatiwal::message_policy::EInvalidTimeRange)]
fun test_mint_time_lock_fail_invalid_range() {
    let (mut scenario, clock) = setup_scenario();
    
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_time_lock_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            END_TIME,
            START_TIME,
            &clock,
            ctx(&mut scenario),
        );
    };
    
    clock.destroy_for_testing();
    ts::end(scenario);
}

#[test]
fun test_mint_limited_read() {
    let (mut scenario, clock) = setup_scenario();
    
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_limited_read_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            MAX_READS,
            &clock,
            ctx(&mut scenario),
        );
    };
    next_tx(&mut scenario, OWNER);
    {
        let msg = ts::take_shared<SuperMessageLimitedRead>(&scenario);
        assert_eq(msg.message_limit_read_get_owner(), OWNER);
        assert_eq(msg.message_limit_read_get_readers().size(), 0);
        assert_eq(message::get_remaining_reads(&msg), MAX_READS);
        
        let policy = msg.message_limit_read_get_policy();
        assert_eq(message_policy::limited_read_policy_get_max(&policy), MAX_READS);
        
        let cap = get_owner_cap(&scenario);
        assert_eq(cap.message_cap_get_message_id(), object::id(&msg));
        
        return_owner_cap(OWNER, cap);
        ts::return_shared(msg);
    };

    clock.destroy_for_testing();
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = message_policy::EInvalidMaxReads)]
fun test_mint_limited_read_fail_zero_max() {
    let (mut scenario, clock) = setup_scenario();
    
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_limited_read_and_transfer(
            GROUP_ID.to_id(),
            string_blob(),
            0,
            &clock,
            ctx(&mut scenario),
        );
    };
    
    clock.destroy_for_testing();
    ts::end(scenario);
}

#[test]
fun test_mint_fee_based() {
    let (mut scenario, clock) = setup_scenario();
    
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_fee_based_and_transfer<SUI>(
            GROUP_ID.to_id(),
            string_blob(),
            FEE_AMOUNT,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };
    next_tx(&mut scenario, OWNER);
    {
        let msg = ts::take_shared<SuperMessageFeeBased<SUI>>(&scenario);
        assert_eq(msg.message_fee_based_get_owner(), OWNER);
        assert_eq(message::get_collected_fees(&msg), 0);
        
        let policy = msg.message_fee_based_get_policy();
        assert_eq(message_policy::fee_based_policy_get_fee_amount(policy), FEE_AMOUNT);
        assert_eq(message_policy::fee_based_policy_get_recipient(policy), RECIPIENT);
        
        let cap = get_owner_cap(&scenario);
        assert_eq(cap.message_cap_get_message_id(), object::id(&msg));
        
        return_owner_cap(OWNER, cap);
        ts::return_shared(msg);
    };

    clock.destroy_for_testing();
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::chatiwal::message_policy::EInvalidFeeAmount)]
fun test_mint_fee_based_fail_zero_fee() {
    let (mut scenario, clock) = setup_scenario();
    
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_fee_based_and_transfer<SUI>(
            GROUP_ID.to_id(),
            string_blob(),
            0,
            RECIPIENT,
            &clock,
            ctx(&mut scenario),
        );
    };
    
    clock.destroy_for_testing();
    ts::end(scenario);
}

#[test]
fun test_mint_compound() {
    let (mut scenario, clock) = setup_scenario();
    
    next_tx(&mut scenario, OWNER);
    {
        message::mint_super_message_compound_and_transfer<SUI>(
            GROUP_ID.to_id(),
            string_blob(),
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
        let msg = ts::take_shared<SuperMessageCompound<SUI>>(&scenario);
        assert_eq(msg.message_compound_get_owner(), OWNER);
        assert_eq(message::get_collected_fees_compound(&msg), 0);
        assert_eq(msg.message_compound_get_readers().size(), 0);
        assert_eq(message::message_compound_get_remaining_reads(&msg), MAX_READS);
        
        let tl_policy = msg.message_compound_get_time_lock();
        assert_eq(message_policy::time_lock_policy_get_from(&tl_policy), START_TIME);
        
        let lr_policy = msg.message_compound_get_limited_read();
        assert_eq(message_policy::limited_read_policy_get_max(&lr_policy), MAX_READS);
        
        let fb_policy = msg.message_compound_get_fee_policy();
        assert_eq(message_policy::fee_based_policy_get_fee_amount(fb_policy), FEE_AMOUNT);
        assert_eq(message_policy::fee_based_policy_get_recipient(fb_policy), RECIPIENT);
        
        let cap = get_owner_cap(&scenario);
        assert_eq(cap.message_cap_get_message_id(), object::id(&msg));
        
        return_owner_cap(OWNER, cap);
        ts::return_shared(msg);
    };

    clock.destroy_for_testing();
    ts::end(scenario);
}