import { ExecutionContext, Query, createParamDecorator } from '@nestjs/common'
import { Request } from 'express'
import { platformSchema } from '../modules/auth/dtos/platform.dto'
import { ZodPipe } from '../pipes/zod.pipe'

export const Platform = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest()
    return request.query.platform
  },
  [Query('platform', new ZodPipe(platformSchema))],
)
