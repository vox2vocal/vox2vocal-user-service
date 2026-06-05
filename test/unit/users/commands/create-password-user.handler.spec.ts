import { ConflictException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { mock, MockProxy, mockReset } from 'jest-mock-extended'

import { CreatePasswordUserCommand } from '../../../../src/users/commands/create-password-user.command'
import { CreatePasswordUserHandler } from '../../../../src/users/commands/create-password-user.handler'
import { SignupPolicy } from '../../../../src/users/policies/signup.policy'
import { UsersRepository } from '../../../../src/users/repositories/users.repository'
import { PasswordHashService } from '../../../../src/users/security/password-hash.service'
import { createUserView, createUserWithPasswordCredential } from '../../../helpers/users.fixtures'

describe('CreatePasswordUserHandler', () => {
  let handler: CreatePasswordUserHandler
  let usersRepository: MockProxy<UsersRepository>
  let passwordHashService: MockProxy<PasswordHashService>
  let signupPolicy: SignupPolicy

  beforeEach(() => {
    usersRepository = mock<UsersRepository>()
    passwordHashService = mock<PasswordHashService>()
    signupPolicy = new SignupPolicy()

    handler = new CreatePasswordUserHandler(usersRepository, passwordHashService, signupPolicy)
  })

  afterEach(() => {
    mockReset(usersRepository)
    mockReset(passwordHashService)
  })

  it('가입 입력값을 정규화하고 비밀번호 hash와 함께 사용자 및 credential 생성을 요청한다', async () => {
    const createdUser = createUserView({
      email: 'user@example.com',
      displayName: 'User',
    })

    usersRepository.findByEmailWithPasswordCredential.mockResolvedValue(null)
    passwordHashService.hash.mockResolvedValue('$argon2id$hash')
    usersRepository.createPasswordUser.mockResolvedValue(createdUser)

    await expect(
      handler.execute(
        new CreatePasswordUserCommand('  USER@EXAMPLE.COM ', 'password123', '  User  '),
      ),
    ).resolves.toEqual(createdUser)
    expect(usersRepository.findByEmailWithPasswordCredential).toHaveBeenCalledWith(
      'user@example.com',
    )
    expect(passwordHashService.hash).toHaveBeenCalledWith('password123')
    expect(usersRepository.createPasswordUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      displayName: 'User',
      passwordHash: '$argon2id$hash',
    })
  })

  it('이미 같은 이메일 사용자가 있으면 가입을 거부한다', async () => {
    usersRepository.findByEmailWithPasswordCredential.mockResolvedValue(
      createUserWithPasswordCredential(),
    )

    await expect(
      handler.execute(new CreatePasswordUserCommand('user@example.com', 'password123', 'User')),
    ).rejects.toThrow(ConflictException)
    expect(passwordHashService.hash).not.toHaveBeenCalled()
    expect(usersRepository.createPasswordUser).not.toHaveBeenCalled()
  })

  it('DB unique 제약 충돌이 발생하면 가입 충돌 오류로 변환한다', async () => {
    const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    })

    usersRepository.findByEmailWithPasswordCredential.mockResolvedValue(null)
    passwordHashService.hash.mockResolvedValue('$argon2id$hash')
    usersRepository.createPasswordUser.mockRejectedValue(uniqueError)

    await expect(
      handler.execute(new CreatePasswordUserCommand('user@example.com', 'password123', 'User')),
    ).rejects.toThrow(ConflictException)
  })

  it('DB unique 제약 외 오류는 그대로 전파한다', async () => {
    usersRepository.findByEmailWithPasswordCredential.mockResolvedValue(null)
    passwordHashService.hash.mockResolvedValue('$argon2id$hash')
    usersRepository.createPasswordUser.mockRejectedValue(new Error('database unavailable'))

    await expect(
      handler.execute(new CreatePasswordUserCommand('user@example.com', 'password123', 'User')),
    ).rejects.toThrow('database unavailable')
  })
})
