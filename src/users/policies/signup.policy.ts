import { BadRequestException, Injectable } from '@nestjs/common'

export type NormalizedSignupInput = {
  email: string
  password: string
  displayName: string
}

@Injectable()
export class SignupPolicy {
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  private readonly minPasswordLength = 8
  private readonly maxDisplayNameLength = 80

  normalizeAndValidate(input: {
    email: string
    password: string
    displayName: string
  }): NormalizedSignupInput {
    const email = input.email.trim().toLowerCase()
    const password = input.password
    const displayName = input.displayName.trim()

    if (!this.emailPattern.test(email)) {
      throw new BadRequestException('Invalid email')
    }

    if (password.length < this.minPasswordLength) {
      throw new BadRequestException('Password must be at least 8 characters')
    }

    if (!displayName) {
      throw new BadRequestException('Display name is required')
    }

    if (displayName.length > this.maxDisplayNameLength) {
      throw new BadRequestException('Display name is too long')
    }

    return {
      email,
      password,
      displayName,
    }
  }
}
