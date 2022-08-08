import { Controller, Get, HttpStatus, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthUser } from '../../../../decorators/auth-user.decorator'
import { Platform } from '../../../../decorators/platform.decorator'
import { HttpResponses } from '../../../../utils/default-responses'
import { AuthUserDto } from '../../../auth/dtos/auth-user.dto'
import { DeliveredNotificationsUseCase } from './delivered-notifications.usecase'

@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
export class DeliveredNotificationsController {
  constructor(private readonly deliveredNotificationsUseCase: DeliveredNotificationsUseCase) {}

  @Get('delivered')
  @ApiResponse({
    status: HttpStatus.OK,
    description: HttpResponses.OK.message,
  })
  async execute(
    @Platform() platform: string,
    @AuthUser() authUser: AuthUserDto,
    @Query('notification_id') notification_id: number,
  ) {
    return this.deliveredNotificationsUseCase.execute({
      ...authUser,
      notification_id,
      platform,
    })
  }
}
