import { NotFoundException } from '@nestjs/common'
import { mock, MockProxy, mockReset } from 'jest-mock-extended'

import { GetUserHandler } from '../../../../src/users/queries/get-user.handler'
import { GetUserQuery } from '../../../../src/users/queries/get-user.query'
import { UsersRepository } from '../../../../src/users/repositories/users.repository'
import { createUserView } from '../../../helpers/users.fixtures'

describe('GetUserHandler', () => {
  let handler: GetUserHandler
  let usersRepository: MockProxy<UsersRepository>

  beforeEach(() => {
    usersRepository = mock<UsersRepository>()
    handler = new GetUserHandler(usersRepository)
  })

  afterEach(() => {
    mockReset(usersRepository)
  })

  it('passes the query user id to the repository and returns the user view', async () => {
    const user = createUserView({ id: 'user-id' })

    usersRepository.findById.calledWith('user-id').mockResolvedValue(user)

    await expect(handler.execute(new GetUserQuery('user-id'))).resolves.toEqual(user)
    expect(usersRepository.findById).toHaveBeenCalledWith('user-id')
  })

  it('throws NotFoundException when the user does not exist', async () => {
    usersRepository.findById.calledWith('missing-user').mockResolvedValue(null)

    await expect(handler.execute(new GetUserQuery('missing-user'))).rejects.toThrow(
      NotFoundException,
    )
  })
})
