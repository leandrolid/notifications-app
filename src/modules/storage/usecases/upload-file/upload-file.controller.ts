import { Controller, HttpStatus, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiResponse } from '@nestjs/swagger'
import { AuthUser } from '../../../../decorators/auth-user.decorator'
import { Platform } from '../../../../decorators/platform.decorator'
import { HttpResponses } from '../../../../utils/default-responses'
import { AuthUserDto } from '../../../auth/dtos/auth-user.dto'
import { UploadFileDto } from '../../dtos/upload-file.dto'
import { UploadFileUseCase } from './upload-file.usecase'

@Controller('upload')
export class UploadFileController {
  constructor(private readonly uploadUseCase: UploadFileUseCase) {}

  @Post('single')
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: HttpResponses.CREATED.message,
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
  async execute(
    @Platform() platform: string,
    @AuthUser() authUser: AuthUserDto,
    @Query('resource_name') resourceName: UploadFileDto['resourceName'],
    @Query('resource_id') resourceId: number,
    @Query('resource_type') resourceType: UploadFileDto['resourceType'],
    @UploadedFile('file') file: Express.Multer.File,
  ) {
    return await this.uploadUseCase.execute({
      platform,
      resourceName,
      resourceId,
      resourceType,
      userId: authUser.user.user_id,
      file,
    })
  }
}
