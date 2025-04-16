/// This module defines the error codes for the Chatiwal protocol.
///
/// ### Error Code Ranges:
///
/// - `1xxx`: **Access Control & Permissions**
///   Errors related to permission levels, role validation, and access rights.
///
/// - `2xxx`: **Group & Membership Management**
///   Covers group creation, joining/leaving, ban/unban, and request handling.
///
/// - `3xxx`: **Messaging & Interaction**
///   Message-related actions like pinning, storing, and spam control.
///
/// - `4xxx`: **Group State & Metadata**
///   Snapshot creation, metadata updates, group activation/deactivation.
///
/// - `5xxx`: **Assets & Resource Access**
///   Errors tied to asset management, token transfers, and usage-based access.
///
/// - `9xxx`: **Authentication & Security**
///   Unauthorized access, expired credentials, forbidden actions, etc.
///
/// - `10xxx`: **Internal System Errors**
///   Internal logic violations, invariant breaches, unexpected control flows.
module chatiwal::errors;

// === Error Codes ===

const EInvalidPermissionLevel: u64 = 1001;
const EInsufficientPermission: u64 = 1002;
const EUnauthorized: u64 = 1003;
const EForbidden: u64 = 1004;
const ENotGroupOwner: u64 = 1005;
const ENeedHigherPermission: u64 = 1006;
const EGroupNotFound: u64 = 2001;
const ENotGroupMember: u64 = 2002;
const EAlreadyMember: u64 = 2003;
const EAlreadyExists: u64 = 2006;
const EMaxMembers: u64 = 2007;
const EMaxPinnedMessages: u64 = 2008;
const EMaxNameLength: u64 = 2009;
const EEmptyRequiredField: u64 = 2010;
const ENotFound: u64 = 10001;

// === Public Functions ===

public(package) fun require_valid_permission_level(condition: bool) {
    assert!(condition, EInvalidPermissionLevel);
}

public(package) fun require_sufficient_permission(condition: bool) {
    assert!(condition, EInsufficientPermission);
}

public(package) fun require_authorized(condition: bool) {
    assert!(condition, EUnauthorized);
}

public(package) fun require_allowed(condition: bool) {
    assert!(condition, EForbidden);
}

public(package) fun require_is_owner(condition: bool) {
    assert!(condition, ENotGroupOwner);
}

public(package) fun require_permission_at_least(condition: bool) {
    assert!(condition, ENeedHigherPermission);
}

public(package) fun require_group_found(condition: bool) {
    assert!(condition, EGroupNotFound);
}

public(package) fun require_is_member(condition: bool) {
    assert!(condition, ENotGroupMember);
}

public(package) fun require_not_already_member(condition: bool) {
    assert!(condition, EAlreadyMember);
}

public(package) fun require_not_exists(condition: bool) {
    assert!(condition, EAlreadyExists);
}

public(package) fun require_below_max_members(condition: bool) {
    assert!(condition, EMaxMembers);
}

public(package) fun require_below_max_pins(condition: bool) {
    assert!(condition, EMaxPinnedMessages);
}

public(package) fun require_name_length_limit(condition: bool) {
    assert!(condition, EMaxNameLength);
}

public(package) fun require_field_not_empty(condition: bool) {
    assert!(condition, EEmptyRequiredField);
}

public(package) fun require_found(condition: bool) {
    assert!(condition, ENotFound);
}
