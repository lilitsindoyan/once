/**
 * Error codes returned by the API as { error: code }.
 * The UI maps each code to a translated message (messages/*.json → "errors").
 */
export type ErrorCode =
  | "invalid_input"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  // auth
  | "otp_invalid"
  | "otp_expired"
  | "otp_too_soon"
  | "otp_too_many_attempts"
  | "account_suspended"
  | "email_in_use"
  // claim (ToR 4.1)
  | "claim_incorrect"
  | "claim_already_registered"
  | "claim_deactivated"
  | "claim_blocked"
  | "claim_expired"
  // transfer
  | "transfer_email_mismatch"
  | "transfer_own_email"
  | "transfer_not_owner"
  | "link_used"
  | "link_invalid"
  | "link_wrong_email"
  // admin
  | "admin_login_failed"
  | "admin_2fa_required"
  | "admin_2fa_invalid"
  | "bottle_not_in_transfer"
  | "bottle_state";

const STATUS: Partial<Record<ErrorCode, number>> = {
  invalid_input: 400,
  unauthorized: 401,
  admin_2fa_required: 401,
  forbidden: 403,
  account_suspended: 403,
  not_found: 404,
  rate_limited: 429,
  claim_blocked: 429,
  otp_too_soon: 429,
  otp_too_many_attempts: 429,
};

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public details?: Record<string, unknown>,
  ) {
    super(code);
  }
  get status(): number {
    return STATUS[this.code] ?? 422;
  }
}
