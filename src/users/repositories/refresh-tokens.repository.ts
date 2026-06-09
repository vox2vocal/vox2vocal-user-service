import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'

export const refreshTokenStatuses = {
  invalid: 'INVALID',
  ok: 'OK',
  reused: 'TOKEN_REUSE_DETECTED',
} as const

export type RefreshTokenStatus = (typeof refreshTokenStatuses)[keyof typeof refreshTokenStatuses]

export type RefreshTokenResult = {
  status: RefreshTokenStatus
  tokenFamily: string
  tokenId: string
}

type RegisterRefreshTokenInput = {
  deviceId?: string
  expiresAt: Date
  ipAddress?: string
  tokenFamily: string
  tokenHash: string
  userAgent?: string
  userId: string
}

type RotateRefreshTokenInput = {
  deviceId?: string
  expiresAt: Date
  ipAddress?: string
  nextTokenHash: string
  revokedReason: string
  tokenFamily: string
  tokenHash: string
  userAgent?: string
  userId: string
}

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterRefreshTokenInput): Promise<RefreshTokenResult> {
    const token = await this.prisma.refreshToken.create({
      data: {
        deviceId: input.deviceId || null,
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress || null,
        tokenFamily: input.tokenFamily,
        tokenHash: input.tokenHash,
        userAgent: input.userAgent || null,
        userId: input.userId,
      },
    })

    return {
      status: refreshTokenStatuses.ok,
      tokenFamily: token.tokenFamily,
      tokenId: token.id,
    }
  }

  async rotate(input: RotateRefreshTokenInput): Promise<RefreshTokenResult> {
    const now = new Date()

    return this.prisma.$transaction(async (tx) => {
      const currentToken = await tx.refreshToken.findUnique({
        where: { tokenHash: input.tokenHash },
      })

      if (!currentToken) {
        return this.invalidResult(input.tokenFamily)
      }

      if (currentToken.revokedAt) {
        await this.revokeFamily(tx, currentToken.tokenFamily, 'refresh_token_reuse_detected', now)

        return {
          status: refreshTokenStatuses.reused,
          tokenFamily: currentToken.tokenFamily,
          tokenId: currentToken.id,
        }
      }

      if (
        currentToken.userId !== input.userId ||
        currentToken.tokenFamily !== input.tokenFamily ||
        currentToken.expiresAt <= now
      ) {
        return {
          status: refreshTokenStatuses.invalid,
          tokenFamily: currentToken.tokenFamily,
          tokenId: currentToken.id,
        }
      }

      const nextToken = await tx.refreshToken.create({
        data: {
          deviceId: input.deviceId || currentToken.deviceId,
          expiresAt: input.expiresAt,
          ipAddress: input.ipAddress || currentToken.ipAddress,
          tokenFamily: currentToken.tokenFamily,
          tokenHash: input.nextTokenHash,
          userAgent: input.userAgent || currentToken.userAgent,
          userId: currentToken.userId,
        },
      })

      await tx.refreshToken.update({
        where: { id: currentToken.id },
        data: {
          lastUsedAt: now,
          replacedById: nextToken.id,
          revokedAt: now,
          revokedReason: input.revokedReason || 'rotated',
        },
      })

      return {
        status: refreshTokenStatuses.ok,
        tokenFamily: nextToken.tokenFamily,
        tokenId: nextToken.id,
      }
    })
  }

  async revokeByHash(tokenHash: string, revokedReason: string): Promise<RefreshTokenResult> {
    const now = new Date()

    return this.prisma.$transaction(async (tx) => {
      const token = await tx.refreshToken.findUnique({
        where: { tokenHash },
      })

      if (!token) {
        return this.invalidResult('')
      }

      if (!token.revokedAt) {
        await tx.refreshToken.update({
          where: { id: token.id },
          data: {
            revokedAt: now,
            revokedReason: revokedReason || 'logout',
          },
        })
      }

      return {
        status: refreshTokenStatuses.ok,
        tokenFamily: token.tokenFamily,
        tokenId: token.id,
      }
    })
  }

  private invalidResult(tokenFamily: string): RefreshTokenResult {
    return {
      status: refreshTokenStatuses.invalid,
      tokenFamily,
      tokenId: '',
    }
  }

  private async revokeFamily(
    tx: Prisma.TransactionClient,
    tokenFamily: string,
    revokedReason: string,
    revokedAt: Date,
  ) {
    await tx.refreshToken.updateMany({
      where: {
        tokenFamily,
        revokedAt: null,
      },
      data: {
        revokedAt,
        revokedReason,
      },
    })
  }
}
