import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'

import { UsersService } from './users.service'

type GetUserRequest = {
  userId?: string
  user_id?: string
}

type UserResponse = {
  id: string
  email: string
  display_name: string
  role: string
}

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod('UserService', 'GetUser')
  async getUser(request: GetUserRequest): Promise<UserResponse> {
    const userId = request.userId ?? request.user_id ?? 'demo-user'
    const user = await this.usersService.findOrCreateDemoUser(userId)

    return {
      id: user.id,
      email: user.email,
      display_name: user.displayName,
      role: user.role,
    }
  }
}
