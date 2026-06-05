import { UserStatus } from '@prisma/client'

export type UserView = {
  id: string
  email: string
  displayName: string
  role: string
  status: UserStatus
}

export type PasswordCredentialView = {
  id: string
  userId: string
  passwordHash: string
  failedLoginCount: number
  lockedUntil: Date | null
}

export type UserWithPasswordCredential = UserView & {
  passwordCredential: PasswordCredentialView | null
}

export type UserResponse = {
  id: string
  email: string
  display_name: string
  role: string
}
