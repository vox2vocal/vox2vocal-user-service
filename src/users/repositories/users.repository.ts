import { Injectable } from '@nestjs/common'
import { UserStatus } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    })
  }

  async findByEmailWithPasswordCredential(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        passwordCredential: true,
      },
    })
  }

  async createPasswordUser(data: { email: string; displayName: string; passwordHash: string }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          displayName: data.displayName,
          role: 'USER',
          status: UserStatus.ACTIVE,
          passwordCredential: {
            create: {
              passwordHash: data.passwordHash,
              failedLoginCount: 0,
            },
          },
        },
      })

      return user
    })
  }

  async updateLastLoginAt(userId: string, loggedInAt: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: loggedInAt },
    })
  }
}
