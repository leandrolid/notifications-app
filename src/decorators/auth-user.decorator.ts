import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { Request } from 'express'

export const AuthUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request: Request = ctx.switchToHttp().getRequest()
  const authUser = {
    user: request['user'],
    token: request['token'],
  }
  return data ? authUser[data] : authUser
})
