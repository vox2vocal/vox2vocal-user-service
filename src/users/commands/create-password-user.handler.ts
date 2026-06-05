import { ConflictException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Prisma } from '@prisma/client'

import { SignupPolicy } from '../policies/signup.policy'
import { UsersRepository } from '../repositories/users.repository'
import { PasswordHashService } from '../security/password-hash.service'
import { UserView } from '../user.types'
import { CreatePasswordUserCommand } from './create-password-user.command'

@CommandHandler(CreatePasswordUserCommand)
export class CreatePasswordUserHandler implements ICommandHandler<
  CreatePasswordUserCommand,
  UserView
> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly signupPolicy: SignupPolicy,
  ) {}

  async execute(command: CreatePasswordUserCommand): Promise<UserView> {
    const input = this.signupPolicy.normalizeAndValidate({
      email: command.email,
      password: command.password,
      displayName: command.displayName,
    })
    const existingUser = await this.usersRepository.findByEmailWithPasswordCredential(input.email)

    if (existingUser) {
      throw new ConflictException('Email already exists')
    }

    const passwordHash = await this.passwordHashService.hash(input.password)

    try {
      return await this.usersRepository.createPasswordUser({
        email: input.email,
        displayName: input.displayName,
        passwordHash,
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already exists')
      }

      throw error
    }
  }
}
