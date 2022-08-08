import { Body, Controller, HttpStatus, Post, UploadedFiles, UseInterceptors } from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthUser } from '../../../../decorators/auth-user.decorator'
import { Platform } from '../../../../decorators/platform.decorator'
import { ZodPipe } from '../../../../pipes/zod.pipe'
import { HttpResponses } from '../../../../utils/default-responses'
import { AuthUserDto } from '../../../auth/dtos/auth-user.dto'
import { CreateNotificationDto, createNotificationSchema } from '../../dtos/create-notification.dto'
import { CreateNotificationUseCase } from './create-notification.usecase'

@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth()
export class CreateNotificationController {
  constructor(private readonly createNotificationUseCase: CreateNotificationUseCase) {}

  @Post('create')
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: HttpResponses.CREATED.message,
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'header_blob', maxCount: 1 },
      { name: 'files_blob', maxCount: 3 },
    ]),
  )
  async execute(
    @Platform() platform: string,
    @AuthUser() authUser: AuthUserDto,
    @Body(new ZodPipe(createNotificationSchema)) data: CreateNotificationDto,
    @UploadedFiles()
    files: { header_blob: Express.Multer.File[]; files_blob: Express.Multer.File[] },
  ) {
    return await this.createNotificationUseCase.execute({
      ...data,
      ...authUser,
      header_blob: files.header_blob?.[0],
      files_blob: files.files_blob,
      platform,
    })
  }
}
