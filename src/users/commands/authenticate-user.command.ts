import { Command } from '@nestjs/cqrs'

import { UserView } from '../user.types'

export class AuthenticateUserCommand extends Command<UserView> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super()
  }
}
