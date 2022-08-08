import { Body, Controller, HttpStatus, Patch } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthUser } from '../../../../decorators/auth-user.decorator'
import { Platform } from '../../../../decorators/platform.decorator'
import { ZodPipe } from '../../../../pipes/zod.pipe'
import { HttpResponses } from '../../../../utils/default-responses'
import { AuthUserDto } from '../../../auth/dtos/auth-user.dto'
import {
  ArchiveNotificationDto,
  archiveNotificationSchema,
} from '../../dtos/archive-notification.dto'
import { ArchiveNotificationUseCase } from './archive-notification.usecase'

@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
export class ArchiveNotificationController {
  constructor(private readonly archiveNotificationUseCase: ArchiveNotificationUseCase) {}

  @Patch('archive')
  @ApiResponse({
    status: HttpStatus.OK,
    description: HttpResponses.OK.message,
  })
  async execute(
    @Platform() platform: string,
    @AuthUser() authUser: AuthUserDto,
    @Body(new ZodPipe(archiveNotificationSchema)) data: ArchiveNotificationDto,
  ) {
    return await this.archiveNotificationUseCase.execute({
      ...data,
      ...authUser,
      platform,
    })
  }
}
