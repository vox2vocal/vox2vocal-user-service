import { Controller } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { GrpcMethod } from '@nestjs/microservices'

import { AuthenticateUserCommand } from './commands/authenticate-user.command'
import { toUserResponse } from './mappers/user-response.mapper'
import { GetUserQuery } from './queries/get-user.query'
import { UserResponse, UserView } from './user.types'

type GetUserRequest = {
  userId?: string
  user_id?: string
}

type AuthenticateUserRequest = {
  email?: string
  password?: string
}

type AuthenticateUserResponse = {
  user: UserResponse
}

@Controller()
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @GrpcMethod('UserService', 'GetUser')
  async getUser(request: GetUserRequest): Promise<UserResponse> {
    const userId = request.userId ?? request.user_id ?? 'demo-user'
    const user = await this.queryBus.execute<GetUserQuery, UserView>(new GetUserQuery(userId))

    return toUserResponse(user)
  }

  @GrpcMethod('UserService', 'AuthenticateUser')
  async authenticateUser(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    const user = await this.commandBus.execute<AuthenticateUserCommand, UserView>(
      new AuthenticateUserCommand(request.email ?? '', request.password ?? ''),
    )

    return {
      user: toUserResponse(user),
    }
  }
}
