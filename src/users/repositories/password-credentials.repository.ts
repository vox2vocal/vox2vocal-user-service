import { Injectable } from '@nestjs/common'

import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PasswordCredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async recordFailure(credentialId: string, failedLoginCount: number, lockedUntil: Date | null) {
    return this.prisma.userPasswordCredential.update({
      where: { id: credentialId },
      data: {
        failedLoginCount,
        lockedUntil,
      },
    })
  }

  async resetFailureState(credentialId: string) {
    return this.prisma.userPasswordCredential.update({
      where: { id: credentialId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
      },
    })
  }
}
