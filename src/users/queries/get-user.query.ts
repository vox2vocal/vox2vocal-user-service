import { Query } from '@nestjs/cqrs'

import { UserView } from '../user.types'

export class GetUserQuery extends Query<UserView> {
  constructor(public readonly userId: string) {
    super()
  }
}
