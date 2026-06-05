import { User, UserPasswordCredential, UserStatus } from '@prisma/client'

export function createPasswordCredential(
  override: Partial<UserPasswordCredential> = {},
): UserPasswordCredential {
  return {
    id: 'credential-id',
    userId: 'user-id',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
    failedLoginCount: 0,
    lockedUntil: null,
    passwordChangedAt: null,
    createdAt: new Date('2026-06-05T00:00:00.000Z'),
    updatedAt: new Date('2026-06-05T00:00:00.000Z'),
    ...override,
  }
}

export function createUserView(override: Partial<User> = {}): User {
  return {
    id: 'user-id',
    email: 'user@example.com',
    displayName: 'User',
    role: 'USER',
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    lastLoginAt: null,
    lastLogoutAt: null,
    createdAt: new Date('2026-06-05T00:00:00.000Z'),
    updatedAt: new Date('2026-06-05T00:00:00.000Z'),
    ...override,
  }
}

export function createUserWithPasswordCredential(
  override: Partial<User & { passwordCredential: UserPasswordCredential | null }> = {},
): User & { passwordCredential: UserPasswordCredential | null } {
  return {
    ...createUserView(),
    passwordCredential: createPasswordCredential(),
    ...override,
  }
}
