import { Command } from '@nestjs/cqrs'

import { UserView } from '../user.types'

export class CreatePasswordUserCommand extends Command<UserView> {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly displayName: string,
  ) {
    super()
  }
}
