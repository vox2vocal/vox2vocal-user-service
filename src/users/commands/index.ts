import { AuthenticateUserHandler } from './authenticate-user.handler'
import { CreatePasswordUserHandler } from './create-password-user.handler'

export const CommandHandlers = [AuthenticateUserHandler, CreatePasswordUserHandler]
