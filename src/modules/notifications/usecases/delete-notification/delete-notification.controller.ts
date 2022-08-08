import { Body, Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthUser } from '../../../../decorators/auth-user.decorator'
import { Platform } from '../../../../decorators/platform.decorator'
import { ZodPipe } from '../../../../pipes/zod.pipe'
import { HttpResponses } from '../../../../utils/default-responses'
import { AuthUserDto } from '../../../auth/dtos/auth-user.dto'
import { ArchiveNotificationDto } from '../../dtos/archive-notification.dto'
import { deleteNotificationSchema } from '../../dtos/delete-notification.dto'
import { DeleteNotificationUseCase } from './delete-notification.usecase'

@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
export class DeleteNotificationController {
  constructor(private readonly deleteNotificationUseCase: DeleteNotificationUseCase) {}

  @Delete('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: HttpResponses.NOT_FOUND.message,
  })
  async execute(
    @Platform() platform: string,
    @AuthUser() authUser: AuthUserDto,
    @Body(new ZodPipe(deleteNotificationSchema)) data: ArchiveNotificationDto,
  ) {
    return await this.deleteNotificationUseCase.execute({
      ...data,
      ...authUser,
      platform,
    })
  }
}
