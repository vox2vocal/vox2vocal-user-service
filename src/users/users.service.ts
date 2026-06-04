import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateDemoUser(userId: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { email: 'demo@abyul.dev' }],
      },
    })

    if (existingUser) {
      return existingUser
    }

    return this.prisma.user.create({
      data: {
        email: 'demo@abyul.dev',
        displayName: 'Demo User',
        role: 'USER',
      },
    })
  }
}
