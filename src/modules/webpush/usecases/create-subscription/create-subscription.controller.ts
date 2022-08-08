import { Body, Controller, HttpStatus, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthUser } from '../../../../decorators/auth-user.decorator'
import { Platform } from '../../../../decorators/platform.decorator'
import { ZodPipe } from '../../../../pipes/zod.pipe'
import { HttpResponses } from '../../../../utils/default-responses'
import { AuthUserDto } from '../../../auth/dtos/auth-user.dto'
import { CreateSubscriptionDto, createSubscriptionSchema } from '../../dtos/create-subscription.dto'
import { CreateSubscriptionUseCase } from './create-subscription.usecase'

@Controller('webpush')
@ApiTags('Webpush')
@ApiBearerAuth()
export class CreateSubscriptionController {
  constructor(private readonly createSubscriptionUseCase: CreateSubscriptionUseCase) {}

  @Post('/subscriptions/create')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: HttpResponses.CREATED.message,
  })
  async execute(
    @Platform() platform: string,
    @AuthUser() authUser: AuthUserDto,
    @Body(new ZodPipe(createSubscriptionSchema)) data: CreateSubscriptionDto,
  ) {
    return this.createSubscriptionUseCase.execute({
      ...data,
      ...authUser,
      platform,
    })
  }
}
