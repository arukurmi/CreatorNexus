const GENERIC_ERROR = 'Something went wrong. Please try again.'
const NETWORK_ERROR = "We couldn't reach the sign-in service. Check your connection and try again."
const RATE_LIMITED = 'Too many attempts. Please wait a minute and try again.'
const ACCOUNT_EXISTS = 'An account with this email already exists. Try signing in instead.'
const SESSION_EXPIRED = 'Your session has expired. Please sign in again.'

const MESSAGE_BY_CODE = new Map<string, string>([
  ['invalid_credentials', "That email and password don't match. Check them and try again."],
  ['email_not_confirmed', 'Please confirm your email first. Check your inbox for the confirmation link.'],
  ['user_already_exists', ACCOUNT_EXISTS],
  ['email_exists', ACCOUNT_EXISTS],
  ['weak_password', 'That password is too weak. Try a longer one that mixes letters, numbers and symbols.'],
  ['same_password', 'Your new password must be different from your current one.'],
  ['over_email_send_rate_limit', "We've sent too many emails to this address. Please wait a few minutes and try again."],
  ['over_request_rate_limit', RATE_LIMITED],
  ['email_address_invalid', "That email address doesn't look right. Check it and try again."],
  ['signup_disabled', 'New sign-ups are turned off right now.'],
  ['otp_expired', 'This link has expired. Please request a new one.'],
  ['session_not_found', SESSION_EXPIRED],
  ['session_expired', SESSION_EXPIRED],
])

/** Maps a Supabase auth error to a sentence safe to show users; never echoes the raw error text. */
export function friendlyAuthError(err: unknown): string {
  const { code, status, name } = (err ?? {}) as { code?: unknown; status?: unknown; name?: unknown }
  const byCode = typeof code === 'string' ? MESSAGE_BY_CODE.get(code) : undefined
  if (byCode) return byCode
  if (name === 'AuthSessionMissingError') return SESSION_EXPIRED
  if (status === 429) return RATE_LIMITED
  if (status === 0 || name === 'AuthRetryableFetchError') return NETWORK_ERROR
  return GENERIC_ERROR
}
