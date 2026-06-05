import { UserStatus } from '@prisma/client'

import { LoginPolicy } from '../src/users/policies/login.policy'
import { PasswordCredentialView, UserWithPasswordCredential } from '../src/users/user.types'

function createCredential(override: Partial<PasswordCredentialView> = {}): PasswordCredentialView {
  return {
    id: 'credential-id',
    userId: 'user-id',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
    failedLoginCount: 0,
    lockedUntil: null,
    ...override,
  }
}

function createUser(
  override: Partial<UserWithPasswordCredential> = {},
): UserWithPasswordCredential {
  return {
    id: 'user-id',
    email: 'user@example.com',
    displayName: 'User',
    role: 'USER',
    status: UserStatus.ACTIVE,
    passwordCredential: createCredential(),
    ...override,
  }
}

describe('LoginPolicy', () => {
  const now = new Date('2026-06-05T00:00:00.000Z')

  it('locks password login for five minutes after the fifth failure', () => {
    const policy = new LoginPolicy()
    const failureState = policy.nextFailureState(createCredential({ failedLoginCount: 4 }), now)

    expect(failureState).toEqual({
      failedLoginCount: 5,
      lockedUntil: new Date('2026-06-05T00:05:00.000Z'),
    })
  })

  it('does not lock before the fifth failure', () => {
    const policy = new LoginPolicy()
    const failureState = policy.nextFailureState(createCredential({ failedLoginCount: 3 }), now)

    expect(failureState).toEqual({
      failedLoginCount: 4,
      lockedUntil: null,
    })
  })

  it('blocks DISABLED and PENDING users from attempting login', () => {
    const policy = new LoginPolicy()

    expect(policy.canAttemptLogin(createUser({ status: UserStatus.DISABLED }), now)).toBe(false)
    expect(policy.canAttemptLogin(createUser({ status: UserStatus.PENDING }), now)).toBe(false)
  })

  it('allows ACTIVE users after a temporary lock expires', () => {
    const policy = new LoginPolicy()
    const user = createUser({
      passwordCredential: createCredential({
        lockedUntil: new Date('2026-06-04T23:59:59.000Z'),
      }),
    })

    expect(policy.canAttemptLogin(user, now)).toBe(true)
  })
})
