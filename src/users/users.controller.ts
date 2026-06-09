import { Controller } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { GrpcMethod } from '@nestjs/microservices'

import { AuthenticateUserCommand } from './commands/authenticate-user.command'
import { CreatePasswordUserCommand } from './commands/create-password-user.command'
import { toUserResponse } from './mappers/user-response.mapper'
import { GetUserQuery } from './queries/get-user.query'
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository'
import { UserResponse, UserView } from './user.types'

type GetUserRequest = {
  userId?: string
  user_id?: string
}

type AuthenticateUserRequest = {
  email?: string
  password?: string
}

type CreatePasswordUserRequest = {
  email?: string
  password?: string
  displayName?: string
  display_name?: string
}

type AuthenticateUserResponse = {
  user: UserResponse
}

type RegisterRefreshTokenRequest = {
  deviceId?: string
  device_id?: string
  expiresAt?: string
  expires_at?: string
  ipAddress?: string
  ip_address?: string
  tokenFamily?: string
  tokenHash?: string
  token_family?: string
  token_hash?: string
  userAgent?: string
  user_agent?: string
  userId?: string
  user_id?: string
}

type RotateRefreshTokenRequest = RegisterRefreshTokenRequest & {
  nextTokenHash?: string
  next_token_hash?: string
  revokedReason?: string
  revoked_reason?: string
}

type RevokeRefreshTokenRequest = {
  revokedReason?: string
  revoked_reason?: string
  tokenHash?: string
  token_hash?: string
}

@Controller()
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  @GrpcMethod('UserService', 'GetUser')
  async getUser(request: GetUserRequest): Promise<UserResponse> {
    const userId = request.userId ?? request.user_id ?? 'demo-user'
    const user = await this.queryBus.execute<GetUserQuery, UserView>(new GetUserQuery(userId))

    return toUserResponse(user)
  }

  @GrpcMethod('UserService', 'CreatePasswordUser')
  async createPasswordUser(request: CreatePasswordUserRequest): Promise<AuthenticateUserResponse> {
    const user = await this.commandBus.execute<CreatePasswordUserCommand, UserView>(
      new CreatePasswordUserCommand(
        request.email ?? '',
        request.password ?? '',
        request.displayName ?? request.display_name ?? '',
      ),
    )

    return {
      user: toUserResponse(user),
    }
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

  @GrpcMethod('UserService', 'RegisterRefreshToken')
  async registerRefreshToken(request: RegisterRefreshTokenRequest) {
    return this.toRefreshTokenResponse(
      await this.refreshTokensRepository.register({
        deviceId: request.deviceId ?? request.device_id,
        expiresAt: this.parseDate(request.expiresAt ?? request.expires_at),
        ipAddress: request.ipAddress ?? request.ip_address,
        tokenFamily: request.tokenFamily ?? request.token_family ?? '',
        tokenHash: request.tokenHash ?? request.token_hash ?? '',
        userAgent: request.userAgent ?? request.user_agent,
        userId: request.userId ?? request.user_id ?? '',
      }),
    )
  }

  @GrpcMethod('UserService', 'RotateRefreshToken')
  async rotateRefreshToken(request: RotateRefreshTokenRequest) {
    return this.toRefreshTokenResponse(
      await this.refreshTokensRepository.rotate({
        deviceId: request.deviceId ?? request.device_id,
        expiresAt: this.parseDate(request.expiresAt ?? request.expires_at),
        ipAddress: request.ipAddress ?? request.ip_address,
        nextTokenHash: request.nextTokenHash ?? request.next_token_hash ?? '',
        revokedReason: request.revokedReason ?? request.revoked_reason ?? 'rotated',
        tokenFamily: request.tokenFamily ?? request.token_family ?? '',
        tokenHash: request.tokenHash ?? request.token_hash ?? '',
        userAgent: request.userAgent ?? request.user_agent,
        userId: request.userId ?? request.user_id ?? '',
      }),
    )
  }

  @GrpcMethod('UserService', 'RevokeRefreshToken')
  async revokeRefreshToken(request: RevokeRefreshTokenRequest) {
    return this.toRefreshTokenResponse(
      await this.refreshTokensRepository.revokeByHash(
        request.tokenHash ?? request.token_hash ?? '',
        request.revokedReason ?? request.revoked_reason ?? 'logout',
      ),
    )
  }

  private parseDate(value?: string): Date {
    const date = value ? new Date(value) : new Date('')

    return Number.isNaN(date.getTime()) ? new Date(0) : date
  }

  private toRefreshTokenResponse(result: { status: string; tokenFamily: string; tokenId: string }) {
    return {
      status: result.status,
      token_family: result.tokenFamily,
      token_id: result.tokenId,
    }
  }
}
