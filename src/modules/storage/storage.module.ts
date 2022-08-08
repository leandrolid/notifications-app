import { Module } from '@nestjs/common'
import { RepositoriesModule } from '../../repositories/repositories.module'
import { S3Storage } from './services/s3-storage'
import { Storage } from './services/storage'
import { UploadFileController } from './usecases/upload-file/upload-file.controller'
import { UploadFileUseCase } from './usecases/upload-file/upload-file.usecase'
import { UploadFilesController } from './usecases/upload-files/upload-files.controller'
import { UploadFilesUseCase } from './usecases/upload-files/upload-files.usecase'

@Module({
  imports: [RepositoriesModule],
  controllers: [UploadFileController, UploadFilesController],
  providers: [{ provide: Storage, useClass: S3Storage }, UploadFileUseCase, UploadFilesUseCase],
  exports: [UploadFileUseCase, UploadFilesUseCase],
})
export class StorageModule {}
