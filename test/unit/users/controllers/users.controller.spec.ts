import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { mock, MockProxy, mockReset } from 'jest-mock-extended'

import { AuthenticateUserCommand } from '../../../../src/users/commands/authenticate-user.command'
import { CreatePasswordUserCommand } from '../../../../src/users/commands/create-password-user.command'
import { GetUserQuery } from '../../../../src/users/queries/get-user.query'
import { RefreshTokensRepository } from '../../../../src/users/repositories/refresh-tokens.repository'
import { UsersController } from '../../../../src/users/users.controller'
import { createUserView } from '../../../helpers/users.fixtures'

describe('UsersController', () => {
  let controller: UsersController
  let commandBus: MockProxy<CommandBus>
  let queryBus: MockProxy<QueryBus>
  let refreshTokensRepository: MockProxy<RefreshTokensRepository>

  beforeEach(() => {
    commandBus = mock<CommandBus>()
    queryBus = mock<QueryBus>()
    refreshTokensRepository = mock<RefreshTokensRepository>()
    controller = new UsersController(commandBus, queryBus, refreshTokensRepository)
  })

  afterEach(() => {
    mockReset(commandBus)
    mockReset(queryBus)
    mockReset(refreshTokensRepository)
  })

  it('maps GetUser gRPC snake_case request to GetUserQuery', async () => {
    const user = createUserView({
      id: 'user-id',
      email: 'user@example.com',
      displayName: 'User',
      role: 'USER',
    })

    queryBus.execute.mockResolvedValue(user)

    await expect(controller.getUser({ user_id: 'user-id' })).resolves.toEqual({
      displayName: 'User',
      id: 'user-id',
      email: 'user@example.com',
      display_name: 'User',
      role: 'USER',
    })
    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserQuery('user-id'))
  })

  it('uses demo-user fallback when GetUser request omits the id', async () => {
    queryBus.execute.mockResolvedValue(createUserView({ id: 'demo-user' }))

    await controller.getUser({})

    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserQuery('demo-user'))
  })

  it('maps AuthenticateUser gRPC request to AuthenticateUserCommand', async () => {
    const user = createUserView({
      id: 'user-id',
      email: 'user@example.com',
      displayName: 'User',
      role: 'USER',
    })

    commandBus.execute.mockResolvedValue(user)

    await expect(
      controller.authenticateUser({
        email: 'user@example.com',
        password: 'password',
      }),
    ).resolves.toEqual({
      user: {
        displayName: 'User',
        id: 'user-id',
        email: 'user@example.com',
        display_name: 'User',
        role: 'USER',
      },
    })
    expect(commandBus.execute).toHaveBeenCalledWith(
      new AuthenticateUserCommand('user@example.com', 'password'),
    )
  })

  it('maps missing AuthenticateUser fields to empty strings', async () => {
    commandBus.execute.mockResolvedValue(createUserView())

    await controller.authenticateUser({})

    expect(commandBus.execute).toHaveBeenCalledWith(new AuthenticateUserCommand('', ''))
  })

  it('CreatePasswordUser gRPC 요청을 CreatePasswordUserCommand로 매핑한다', async () => {
    const user = createUserView({
      id: 'user-id',
      email: 'user@example.com',
      displayName: 'User',
      role: 'USER',
    })

    commandBus.execute.mockResolvedValue(user)

    await expect(
      controller.createPasswordUser({
        email: 'user@example.com',
        password: 'password123',
        display_name: 'User',
      }),
    ).resolves.toEqual({
      user: {
        displayName: 'User',
        id: 'user-id',
        email: 'user@example.com',
        display_name: 'User',
        role: 'USER',
      },
    })
    expect(commandBus.execute).toHaveBeenCalledWith(
      new CreatePasswordUserCommand('user@example.com', 'password123', 'User'),
    )
  })

  it('CreatePasswordUser 누락 필드는 빈 문자열로 매핑한다', async () => {
    commandBus.execute.mockResolvedValue(createUserView())

    await controller.createPasswordUser({})

    expect(commandBus.execute).toHaveBeenCalledWith(new CreatePasswordUserCommand('', '', ''))
  })

  it('RegisterRefreshToken gRPC 요청을 repository 입력으로 매핑한다', async () => {
    refreshTokensRepository.register.mockResolvedValue({
      status: 'OK',
      tokenFamily: 'family-id',
      tokenId: 'token-id',
    })

    await expect(
      controller.registerRefreshToken({
        expires_at: '2026-06-17T00:00:00.000Z',
        token_family: 'family-id',
        token_hash: 'hmac-hash',
        user_id: 'user-id',
      }),
    ).resolves.toEqual({
      status: 'OK',
      tokenFamily: 'family-id',
      token_family: 'family-id',
      tokenId: 'token-id',
      token_id: 'token-id',
    })
    expect(refreshTokensRepository.register).toHaveBeenCalledWith({
      deviceId: undefined,
      expiresAt: new Date('2026-06-17T00:00:00.000Z'),
      ipAddress: undefined,
      tokenFamily: 'family-id',
      tokenHash: 'hmac-hash',
      userAgent: undefined,
      userId: 'user-id',
    })
  })

  it('RotateRefreshToken gRPC 요청을 repository 입력으로 매핑한다', async () => {
    refreshTokensRepository.rotate.mockResolvedValue({
      status: 'TOKEN_REUSE_DETECTED',
      tokenFamily: 'family-id',
      tokenId: 'token-id',
    })

    await expect(
      controller.rotateRefreshToken({
        expires_at: '2026-06-17T00:00:00.000Z',
        next_token_hash: 'next-hash',
        token_family: 'family-id',
        token_hash: 'old-hash',
        user_id: 'user-id',
      }),
    ).resolves.toEqual({
      status: 'TOKEN_REUSE_DETECTED',
      tokenFamily: 'family-id',
      token_family: 'family-id',
      tokenId: 'token-id',
      token_id: 'token-id',
    })
    expect(refreshTokensRepository.rotate).toHaveBeenCalledWith(
      expect.objectContaining({
        nextTokenHash: 'next-hash',
        tokenHash: 'old-hash',
      }),
    )
  })

  it('RevokeRefreshToken gRPC 요청을 repository 입력으로 매핑한다', async () => {
    refreshTokensRepository.revokeByHash.mockResolvedValue({
      status: 'OK',
      tokenFamily: 'family-id',
      tokenId: 'token-id',
    })

    await controller.revokeRefreshToken({
      revoked_reason: 'logout',
      token_hash: 'hmac-hash',
    })

    expect(refreshTokensRepository.revokeByHash).toHaveBeenCalledWith('hmac-hash', 'logout')
  })
})
