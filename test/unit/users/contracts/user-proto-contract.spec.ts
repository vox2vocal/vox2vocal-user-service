import { readFileSync } from 'fs'
import { join } from 'path'

describe('user.proto contract', () => {
  const proto = readFileSync(join(process.cwd(), 'proto', 'user.proto'), 'utf8')

  it('declares the expected package and service', () => {
    expect(proto).toContain('package user;')
    expect(proto).toContain('service UserService')
  })

  it('GetUser, CreatePasswordUser, AuthenticateUser RPC를 선언한다', () => {
    expect(proto).toContain('rpc GetUser(GetUserRequest) returns (UserResponse);')
    expect(proto).toContain(
      'rpc CreatePasswordUser(CreatePasswordUserRequest) returns (CreatePasswordUserResponse);',
    )
    expect(proto).toContain(
      'rpc AuthenticateUser(AuthenticateUserRequest) returns (AuthenticateUserResponse);',
    )
    expect(proto).toContain(
      'rpc RegisterRefreshToken(RegisterRefreshTokenRequest) returns (RefreshTokenResponse);',
    )
    expect(proto).toContain(
      'rpc RotateRefreshToken(RotateRefreshTokenRequest) returns (RefreshTokenResponse);',
    )
    expect(proto).toContain(
      'rpc RevokeRefreshToken(RevokeRefreshTokenRequest) returns (RefreshTokenResponse);',
    )
  })

  it('예상한 요청과 응답 필드를 선언한다', () => {
    expect(proto).toContain('string user_id = 1;')
    expect(proto).toContain('string display_name = 3;')
    expect(proto).toContain('string email = 1;')
    expect(proto).toContain('string password = 2;')
    expect(proto).toContain('UserResponse user = 1;')
  })
})
