import { Controller, Get, HttpStatus, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthUser } from '../../../../decorators/auth-user.decorator'
import { Platform } from '../../../../decorators/platform.decorator'
import { ZodPipe } from '../../../../pipes/zod.pipe'
import { HttpResponses } from '../../../../utils/default-responses'
import { AuthUserDto } from '../../../auth/dtos/auth-user.dto'
import { ListNotificationsDto, listNotificationsSchema } from '../../dtos/list-notifications.dto'
import { ListReceivedNotificationsUseCase } from './list-received-notifications.usecase'

@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
export class ListReceivedNotificationsController {
  constructor(private readonly searchNotificationsUseCase: ListReceivedNotificationsUseCase) {}

  @Get('received')
  @ApiResponse({
    status: HttpStatus.OK,
    description: HttpResponses.OK.message,
  })
  async execute(
    @Platform() platform: string,
    @AuthUser() authUser: AuthUserDto,
    @Query(new ZodPipe(listNotificationsSchema)) listNotificationsDto: ListNotificationsDto,
  ) {
    return await this.searchNotificationsUseCase.execute({
      ...listNotificationsDto,
      ...authUser,
      platform,
    })
  }
}
