export class ChatiwalClientError extends Error { }

export class InvalidGroupCapError extends ChatiwalClientError { }

export class MemberAlreadyExistsError extends ChatiwalClientError { }

export class MemberNotExistsError extends ChatiwalClientError { }

export class SealNotApprovedError extends ChatiwalClientError { }

export class TimeLockTooEarlyError extends ChatiwalClientError { }

export class TimeLockExpiredError extends ChatiwalClientError { }

export class MaxReadsReachedError extends ChatiwalClientError { }

export class InsufficientPaymentError extends ChatiwalClientError { }

export class AlreadyPaidError extends ChatiwalClientError { }

export class NotMessageOwnerError extends ChatiwalClientError { }

export class NoFeesToWithdrawError extends ChatiwalClientError { }

export class SealApprovalFailedError extends ChatiwalClientError { }

export class NotMessageRecipientError extends ChatiwalClientError { }

export class NotMatchError extends ChatiwalClientError { }

export class InvalidTimeRangeError extends ChatiwalClientError { }

export class InvalidMaxReadsError extends ChatiwalClientError { }

export class InvalidFeeAmountError extends ChatiwalClientError { }