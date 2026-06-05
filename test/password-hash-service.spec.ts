import { PasswordHashService } from '../src/users/security/password-hash.service'

describe('PasswordHashService', () => {
  it('verifies a password against its hash', async () => {
    const service = new PasswordHashService()
    const passwordHash = await service.hash('correct-password')

    expect(passwordHash).not.toBe('correct-password')
    expect(passwordHash).toMatch(/^\$argon2id\$/)
    await expect(service.verify('correct-password', passwordHash)).resolves.toBe(true)
    await expect(service.verify('wrong-password', passwordHash)).resolves.toBe(false)
  })

  it('rejects unsupported hash formats', async () => {
    const service = new PasswordHashService()

    await expect(service.verify('password', 'unsupported-hash')).resolves.toBe(false)
  })
})
