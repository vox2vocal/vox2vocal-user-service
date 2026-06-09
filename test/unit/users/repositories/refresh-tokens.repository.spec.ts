import { RefreshTokensRepository } from '../../../../src/users/repositories/refresh-tokens.repository'

function createPrismaMock() {
  const refreshToken = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  }

  return {
    $transaction: jest.fn((callback) => callback({ refreshToken })),
    refreshToken,
  }
}

describe('RefreshTokensRepository', () => {
  it('register stores only the token hash and metadata', async () => {
    const prisma = createPrismaMock()
    prisma.refreshToken.create.mockResolvedValue({
      id: 'token-id',
      tokenFamily: 'family-id',
    })
    const repository = new RefreshTokensRepository(prisma as never)

    await expect(
      repository.register({
        deviceId: 'device-id',
        expiresAt: new Date('2026-06-17T00:00:00.000Z'),
        ipAddress: '127.0.0.1',
        tokenFamily: 'family-id',
        tokenHash: 'hmac-hash',
        userAgent: 'agent',
        userId: 'user-id',
      }),
    ).resolves.toEqual({
      status: 'OK',
      tokenFamily: 'family-id',
      tokenId: 'token-id',
    })
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tokenFamily: 'family-id',
        tokenHash: 'hmac-hash',
        userId: 'user-id',
      }),
    })
  })

  it('rotates the token inside one transaction', async () => {
    const prisma = createPrismaMock()
    prisma.refreshToken.findUnique.mockResolvedValue({
      deviceId: null,
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      id: 'old-token-id',
      ipAddress: null,
      revokedAt: null,
      tokenFamily: 'family-id',
      userAgent: null,
      userId: 'user-id',
    })
    prisma.refreshToken.create.mockResolvedValue({
      id: 'new-token-id',
      tokenFamily: 'family-id',
    })
    const repository = new RefreshTokensRepository(prisma as never)

    await expect(
      repository.rotate({
        expiresAt: new Date('2099-01-08T00:00:00.000Z'),
        nextTokenHash: 'new-hash',
        revokedReason: 'rotated',
        tokenFamily: 'family-id',
        tokenHash: 'old-hash',
        userId: 'user-id',
      }),
    ).resolves.toEqual({
      status: 'OK',
      tokenFamily: 'family-id',
      tokenId: 'new-token-id',
    })
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      data: expect.objectContaining({
        replacedById: 'new-token-id',
        revokedReason: 'rotated',
      }),
      where: { id: 'old-token-id' },
    })
  })

  it('revokes a token family when a revoked refresh token is reused', async () => {
    const prisma = createPrismaMock()
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'old-token-id',
      revokedAt: new Date('2026-06-10T00:00:00.000Z'),
      tokenFamily: 'family-id',
    })
    const repository = new RefreshTokensRepository(prisma as never)

    await expect(
      repository.rotate({
        expiresAt: new Date('2099-01-08T00:00:00.000Z'),
        nextTokenHash: 'new-hash',
        revokedReason: 'rotated',
        tokenFamily: 'family-id',
        tokenHash: 'old-hash',
        userId: 'user-id',
      }),
    ).resolves.toEqual({
      status: 'TOKEN_REUSE_DETECTED',
      tokenFamily: 'family-id',
      tokenId: 'old-token-id',
    })
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({
        revokedReason: 'refresh_token_reuse_detected',
      }),
      where: {
        revokedAt: null,
        tokenFamily: 'family-id',
      },
    })
  })
})
