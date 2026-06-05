import { Injectable } from '@nestjs/common'
import { UserStatus } from '@prisma/client'

import { PasswordCredentialView, UserWithPasswordCredential } from '../user.types'

export type LoginFailureUpdate = {
  failedLoginCount: number
  lockedUntil: Date | null
}

@Injectable()
export class LoginPolicy {
  readonly maxFailedLoginCount = 5
  readonly lockDurationMs = 5 * 60 * 1000

  canAttemptLogin(user: UserWithPasswordCredential, now: Date): boolean {
    return (
      user.status === UserStatus.ACTIVE && !this.isTemporarilyLocked(user.passwordCredential, now)
    )
  }

  isLoginUnavailableStatus(status: UserStatus): boolean {
    return status !== UserStatus.ACTIVE
  }

  isTemporarilyLocked(credential: PasswordCredentialView | null, now: Date): boolean {
    return credential?.lockedUntil ? credential.lockedUntil > now : false
  }

  nextFailureState(credential: PasswordCredentialView, now: Date): LoginFailureUpdate {
    const failedLoginCount = credential.failedLoginCount + 1
    const lockedUntil =
      failedLoginCount >= this.maxFailedLoginCount
        ? new Date(now.getTime() + this.lockDurationMs)
        : credential.lockedUntil

    return {
      failedLoginCount,
      lockedUntil,
    }
  }
}
