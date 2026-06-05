import { Injectable } from '@nestjs/common'

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

  async updateLastLoginAt(userId: string, loggedInAt: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: loggedInAt },
    })
  }
}
