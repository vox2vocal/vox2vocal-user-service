import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { CommandHandlers } from './commands'
import { LoginPolicy } from './policies/login.policy'
import { SignupPolicy } from './policies/signup.policy'
import { QueryHandlers } from './queries'
import { PasswordCredentialsRepository } from './repositories/password-credentials.repository'
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository'
import { UsersRepository } from './repositories/users.repository'
import { PasswordHashService } from './security/password-hash.service'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    PasswordCredentialsRepository,
    RefreshTokensRepository,
    PasswordHashService,
    LoginPolicy,
    SignupPolicy,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class UsersModule {}
