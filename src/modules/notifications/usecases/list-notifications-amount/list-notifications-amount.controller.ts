import { Controller, Get, HttpStatus } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthUser } from '../../../../decorators/auth-user.decorator'
import { Platform } from '../../../../decorators/platform.decorator'
import { HttpResponses } from '../../../../utils/default-responses'
import { AuthUserDto } from '../../../auth/dtos/auth-user.dto'
import { ListNotificationsAmountUseCase } from './list-notifications-amount.usecase'

@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
export class ListNotificationsAmountController {
  constructor(private readonly listNotificationsAmountUseCase: ListNotificationsAmountUseCase) {}

  @Get('amount')
  @ApiResponse({
    status: HttpStatus.OK,
    description: HttpResponses.OK.message,
  })
  async execute(@Platform() platform: string, @AuthUser() authUser: AuthUserDto) {
    return await this.listNotificationsAmountUseCase.execute({
      ...authUser,
      platform,
    })
  }
}
