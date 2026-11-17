import { describe, it, expect } from 'vitest'
import { AuthApiError, AuthRetryableFetchError, AuthSessionMissingError } from '@supabase/supabase-js'
import { friendlyAuthError } from '@/lib/authErrors'

const RAW = 'raw server text that must never reach the user'

describe('friendlyAuthError', () => {
  it.each([
    ['invalid_credentials', /email and password don't match/i],
    ['email_not_confirmed', /confirm your email/i],
    ['user_already_exists', /already exists/i],
    ['email_exists', /already exists/i],
    ['weak_password', /too weak/i],
    ['same_password', /different from your current/i],
    ['over_email_send_rate_limit', /too many emails/i],
    ['over_request_rate_limit', /too many attempts/i],
    ['email_address_invalid', /email address doesn't look right/i],
    ['signup_disabled', /sign-ups are turned off/i],
    ['otp_expired', /link has expired/i],
    ['session_not_found', /session has expired/i],
    ['session_expired', /session has expired/i],
  ])('maps the %s code to a friendly sentence', (code, expected) => {
    const message = friendlyAuthError(new AuthApiError(RAW, 400, code))
    expect(message).toMatch(expected)
    expect(message).not.toContain(RAW)
  })

  it.each([
    ['an HTTP 429 without a code', new AuthApiError(RAW, 429, undefined), /too many attempts/i],
    ['a network failure', new AuthRetryableFetchError(RAW, 0), /couldn't reach/i],
    ['a status-0 error', { message: RAW, status: 0 }, /couldn't reach/i],
    ['a missing session', new AuthSessionMissingError(), /session has expired/i],
    ['an unknown code', new AuthApiError(RAW, 500, 'unexpected_failure'), /something went wrong/i],
    ['a prototype key as code', { message: RAW, code: 'toString' }, /something went wrong/i],
    ['a plain Error', new Error(RAW), /something went wrong/i],
    ['a thrown string', RAW, /something went wrong/i],
    ['null', null, /something went wrong/i],
  ])('maps %s to a friendly sentence', (_case, err, expected) => {
    const message = friendlyAuthError(err)
    expect(message).toMatch(expected)
    expect(message).not.toContain(RAW)
  })
})
