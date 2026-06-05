import { NotFoundException } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'

import { UsersRepository } from '../repositories/users.repository'
import { UserView } from '../user.types'
import { GetUserQuery } from './get-user.query'

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserView> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(query: GetUserQuery): Promise<UserView> {
    const user = await this.usersRepository.findById(query.userId)

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }
}
