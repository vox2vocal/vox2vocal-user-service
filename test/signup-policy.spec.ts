import { BadRequestException } from '@nestjs/common'

import { SignupPolicy } from '../src/users/policies/signup.policy'

describe('SignupPolicy', () => {
  it('회원 가입 입력값을 DB 저장 규칙에 맞게 정규화한다', () => {
    const policy = new SignupPolicy()

    expect(
      policy.normalizeAndValidate({
        email: '  USER@EXAMPLE.COM ',
        password: 'password123',
        displayName: '  User  ',
      }),
    ).toEqual({
      email: 'user@example.com',
      password: 'password123',
      displayName: 'User',
    })
  })

  it('이메일 형식이 잘못되면 거부한다', () => {
    const policy = new SignupPolicy()

    expect(() =>
      policy.normalizeAndValidate({
        email: 'invalid-email',
        password: 'password123',
        displayName: 'User',
      }),
    ).toThrow(BadRequestException)
  })

  it('비밀번호가 8자 미만이면 거부한다', () => {
    const policy = new SignupPolicy()

    expect(() =>
      policy.normalizeAndValidate({
        email: 'user@example.com',
        password: 'short',
        displayName: 'User',
      }),
    ).toThrow(BadRequestException)
  })

  it('표시 이름이 비어 있거나 너무 길면 거부한다', () => {
    const policy = new SignupPolicy()

    expect(() =>
      policy.normalizeAndValidate({
        email: 'user@example.com',
        password: 'password123',
        displayName: '   ',
      }),
    ).toThrow(BadRequestException)
    expect(() =>
      policy.normalizeAndValidate({
        email: 'user@example.com',
        password: 'password123',
        displayName: 'A'.repeat(81),
      }),
    ).toThrow(BadRequestException)
  })
})
