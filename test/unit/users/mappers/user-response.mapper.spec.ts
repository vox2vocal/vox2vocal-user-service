import { toUserResponse } from '../../../../src/users/mappers/user-response.mapper'
import { createUserView } from '../../../helpers/users.fixtures'

describe('toUserResponse', () => {
  it('maps the user read model to the gRPC user response shape', () => {
    expect(
      toUserResponse(
        createUserView({
          id: 'user-id',
          email: 'user@example.com',
          displayName: 'User',
          role: 'ADMIN',
        }),
      ),
    ).toEqual({
      id: 'user-id',
      email: 'user@example.com',
      display_name: 'User',
      role: 'ADMIN',
    })
  })
})
