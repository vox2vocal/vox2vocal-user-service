import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { UserStatus } from '@prisma/client'
import { mock, MockProxy, mockReset } from 'jest-mock-extended'

import { AuthenticateUserCommand } from '../../../../src/users/commands/authenticate-user.command'
import { AuthenticateUserHandler } from '../../../../src/users/commands/authenticate-user.handler'
import { LoginPolicy } from '../../../../src/users/policies/login.policy'
import { PasswordCredentialsRepository } from '../../../../src/users/repositories/password-credentials.repository'
import { UsersRepository } from '../../../../src/users/repositories/users.repository'
import { PasswordHashService } from '../../../../src/users/security/password-hash.service'
import {
  createPasswordCredential,
  createUserView,
  createUserWithPasswordCredential,
} from '../../../helpers/users.fixtures'

describe('AuthenticateUserHandler', () => {
  const now = new Date('2026-06-05T00:00:00.000Z')

  let handler: AuthenticateUserHandler
  let usersRepository: MockProxy<UsersRepository>
  let passwordCredentialsRepository: MockProxy<PasswordCredentialsRepository>
  let passwordHashService: MockProxy<PasswordHashService>
  let loginPolicy: MockProxy<LoginPolicy>

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(now)

    usersRepository = mock<UsersRepository>()
    passwordCredentialsRepository = mock<PasswordCredentialsRepository>()
    passwordHashService = mock<PasswordHashService>()
    loginPolicy = mock<LoginPolicy>()

    loginPolicy.isLoginUnavailableStatus.mockReturnValue(false)
    loginPolicy.isTemporarilyLocked.mockReturnValue(false)

    handler = new AuthenticateUserHandler(
      usersRepository,
      passwordCredentialsRepository,
      passwordHashService,
      loginPolicy,
    )
  })

  afterEach(() => {
    jest.useRealTimers()
    mockReset(usersRepository)
    mockReset(passwordCredentialsRepository)
    mockReset(passwordHashService)
    mockReset(loginPolicy)
  })

  it('normalizes email, verifies password, resets failures, and updates last login time', async () => {
    const user = createUserWithPasswordCredential({
      email: 'user@example.com',
      passwordCredential: createPasswordCredential({ failedLoginCount: 2 }),
    })
    const loggedInUser = createUserView()

    usersRepository.findByEmailWithPasswordCredential
      .calledWith('user@example.com')
      .mockResolvedValue(user)
    passwordHashService.verify.mockResolvedValue(true)
    usersRepository.updateLastLoginAt.mockResolvedValue(loggedInUser)

    await expect(
      handler.execute(new AuthenticateUserCommand('  USER@EXAMPLE.COM ', 'correct-password')),
    ).resolves.toEqual(loggedInUser)

    expect(passwordHashService.verify).toHaveBeenCalledWith(
      'correct-password',
      user.passwordCredential?.passwordHash,
    )
    expect(passwordCredentialsRepository.resetFailureState).toHaveBeenCalledWith('credential-id')
    expect(usersRepository.updateLastLoginAt).toHaveBeenCalledWith('user-id', now)
    expect(passwordCredentialsRepository.recordFailure).not.toHaveBeenCalled()
  })

  it('rejects unknown users without verifying a password', async () => {
    usersRepository.findByEmailWithPasswordCredential.mockResolvedValue(null)

    await expect(
      handler.execute(new AuthenticateUserCommand('missing@example.com', 'password')),
    ).rejects.toThrow(UnauthorizedException)

    expect(passwordHashService.verify).not.toHaveBeenCalled()
    expect(passwordCredentialsRepository.recordFailure).not.toHaveBeenCalled()
  })

  it('rejects users without password credentials', async () => {
    usersRepository.findByEmailWithPasswordCredential.mockResolvedValue(
      createUserWithPasswordCredential({ passwordCredential: null }),
    )

    await expect(
      handler.execute(new AuthenticateUserCommand('social-only@example.com', 'password')),
    ).rejects.toThrow(UnauthorizedException)

    expect(passwordHashService.verify).not.toHaveBeenCalled()
  })

  it('rejects inactive statuses before password verification', async () => {
    const user = createUserWithPasswordCredential({ status: UserStatus.DISABLED })

    usersRepository.findByEmailWithPasswordCredential.mockResolvedValue(user)
    loginPolicy.isLoginUnavailableStatus.mockReturnValue(true)

    await expect(
      handler.execute(new AuthenticateUserCommand('disabled@example.com', 'password')),
    ).rejects.toThrow(ForbiddenException)

    expect(passwordHashService.verify).not.toHaveBeenCalled()
  })

  it('rejects temporarily locked credentials before password verification', async () => {
    const lockedUntil = new Date('2026-06-05T00:05:00.000Z')
    const credential = createPasswordCredential({ lockedUntil })
    const user = createUserWithPasswordCredential({ passwordCredential: credential })

    usersRepository.findByEmailWithPasswordCredential.mockResolvedValue(user)
    loginPolicy.isTemporarilyLocked.mockReturnValue(true)

    await expect(
      handler.execute(new AuthenticateUserCommand('locked@example.com', 'password')),
    ).rejects.toThrow(ForbiddenException)

    expect(passwordHashService.verify).not.toHaveBeenCalled()
  })

  it('records failure state when the password is wrong', async () => {
    const credential = createPasswordCredential({ failedLoginCount: 4 })
    const user = createUserWithPasswordCredential({ passwordCredential: credential })
    const lockedUntil = new Date('2026-06-05T00:05:00.000Z')

    usersRepository.findByEmailWithPasswordCredential.mockResolvedValue(user)
    passwordHashService.verify.mockResolvedValue(false)
    loginPolicy.nextFailureState.calledWith(credential, now).mockReturnValue({
      failedLoginCount: 5,
      lockedUntil,
    })

    await expect(
      handler.execute(new AuthenticateUserCommand('user@example.com', 'wrong-password')),
    ).rejects.toThrow(UnauthorizedException)

    expect(passwordCredentialsRepository.recordFailure).toHaveBeenCalledWith(
      'credential-id',
      5,
      lockedUntil,
    )
    expect(passwordCredentialsRepository.resetFailureState).not.toHaveBeenCalled()
    expect(usersRepository.updateLastLoginAt).not.toHaveBeenCalled()
  })
})
