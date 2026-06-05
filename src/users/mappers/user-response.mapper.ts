import { UserResponse, UserView } from '../user.types'

export function toUserResponse(user: UserView): UserResponse {
  return {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    role: user.role,
  }
}
