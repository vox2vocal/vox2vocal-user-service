import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { mock, MockProxy, mockReset } from 'jest-mock-extended'

import { AuthenticateUserCommand } from '../../../../src/users/commands/authenticate-user.command'
import { GetUserQuery } from '../../../../src/users/queries/get-user.query'
import { UsersController } from '../../../../src/users/users.controller'
import { createUserView } from '../../../helpers/users.fixtures'

describe('UsersController', () => {
  let controller: UsersController
  let commandBus: MockProxy<CommandBus>
  let queryBus: MockProxy<QueryBus>

  beforeEach(() => {
    commandBus = mock<CommandBus>()
    queryBus = mock<QueryBus>()
    controller = new UsersController(commandBus, queryBus)
  })

  afterEach(() => {
    mockReset(commandBus)
    mockReset(queryBus)
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
})
