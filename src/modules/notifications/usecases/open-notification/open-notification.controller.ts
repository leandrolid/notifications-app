import { Controller, Get, HttpStatus, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthUser } from '../../../../decorators/auth-user.decorator'
import { Platform } from '../../../../decorators/platform.decorator'
import { ZodPipe } from '../../../../pipes/zod.pipe'
import { HttpResponses } from '../../../../utils/default-responses'
import { AuthUserDto } from '../../../auth/dtos/auth-user.dto'
import { notificationIdSchema } from '../../dtos/open-notification.dto'
import { OpenNotificationUseCase } from './open-notification.usecase'

@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
export class OpenNotificationController {
  constructor(private readonly openNotificationUseCase: OpenNotificationUseCase) {}

  @Get('details')
  @ApiResponse({
    status: HttpStatus.OK,
    description: HttpResponses.OK.message,
  })
  async execute(
    @Platform() platform: string,
    @AuthUser() authUser: AuthUserDto,
    @Query('notification_id', new ZodPipe(notificationIdSchema)) notification_id: number,
  ) {
    return this.openNotificationUseCase.execute({
      ...authUser,
      platform,
      notification_id,
    })
  }
}
