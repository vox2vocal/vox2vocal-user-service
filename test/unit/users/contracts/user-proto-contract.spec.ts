import { readFileSync } from 'fs'
import { join } from 'path'

describe('user.proto contract', () => {
  const proto = readFileSync(join(process.cwd(), 'proto', 'user.proto'), 'utf8')

  it('declares the expected package and service', () => {
    expect(proto).toContain('package user;')
    expect(proto).toContain('service UserService')
  })

  it('declares GetUser and AuthenticateUser RPCs', () => {
    expect(proto).toContain('rpc GetUser(GetUserRequest) returns (UserResponse);')
    expect(proto).toContain(
      'rpc AuthenticateUser(AuthenticateUserRequest) returns (AuthenticateUserResponse);',
    )
  })

  it('declares the expected request and response fields', () => {
    expect(proto).toContain('string user_id = 1;')
    expect(proto).toContain('string display_name = 3;')
    expect(proto).toContain('string email = 1;')
    expect(proto).toContain('string password = 2;')
    expect(proto).toContain('UserResponse user = 1;')
  })
})
