import { AuthUserDto } from '../modules/auth/dtos/auth-user.dto'
import { PlatformDto } from '../modules/auth/dtos/platform.dto'

export type BaseDto<T = object> = PlatformDto & AuthUserDto & T
