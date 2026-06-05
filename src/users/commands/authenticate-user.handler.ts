import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { LoginPolicy } from '../policies/login.policy'
import { PasswordCredentialsRepository } from '../repositories/password-credentials.repository'
import { UsersRepository } from '../repositories/users.repository'
import { PasswordHashService } from '../security/password-hash.service'
import { UserView, UserWithPasswordCredential } from '../user.types'
import { AuthenticateUserCommand } from './authenticate-user.command'

@CommandHandler(AuthenticateUserCommand)
export class AuthenticateUserHandler implements ICommandHandler<AuthenticateUserCommand, UserView> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordCredentialsRepository: PasswordCredentialsRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly loginPolicy: LoginPolicy,
  ) {}

  async execute(command: AuthenticateUserCommand): Promise<UserView> {
    const now = new Date()
    const email = command.email.trim().toLowerCase()
    const user = await this.usersRepository.findByEmailWithPasswordCredential(email)

    if (!user?.passwordCredential) {
      throw new UnauthorizedException('Invalid email or password')
    }

    this.assertLoginAllowed(user, now)

    const isPasswordValid = await this.passwordHashService.verify(
      command.password,
      user.passwordCredential.passwordHash,
    )

    if (!isPasswordValid) {
      const nextFailureState = this.loginPolicy.nextFailureState(user.passwordCredential, now)

      await this.passwordCredentialsRepository.recordFailure(
        user.passwordCredential.id,
        nextFailureState.failedLoginCount,
        nextFailureState.lockedUntil,
      )

      throw new UnauthorizedException('Invalid email or password')
    }

    await this.passwordCredentialsRepository.resetFailureState(user.passwordCredential.id)
    const loggedInUser = await this.usersRepository.updateLastLoginAt(user.id, now)

    return loggedInUser
  }

  private assertLoginAllowed(user: UserWithPasswordCredential, now: Date) {
    if (this.loginPolicy.isLoginUnavailableStatus(user.status)) {
      throw new ForbiddenException('User is not allowed to login')
    }

    if (this.loginPolicy.isTemporarilyLocked(user.passwordCredential, now)) {
      throw new ForbiddenException('User login is temporarily locked')
    }
  }
}
