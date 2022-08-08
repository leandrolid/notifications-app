import { Injectable } from '@nestjs/common'
import { EntityManager } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { getPresignedUrl } from '../../../../utils/get-presigned-url'
import { UploadFilesDto } from '../../dtos/upload-files.dto'
import { StorageAttachment } from '../../entities/storage-attachment.entity'
import { StorageBlob } from '../../entities/storage-blob.entity'
import { Storage } from '../../services/storage'

@Injectable()
export class UploadFilesUseCase {
  constructor(
    private readonly manager: EntityManager,
    private readonly storage: Storage,
  ) {}

  async execute({
    files,
    platform,
    resourceName,
    resourceId,
    userId,
    resourceType,
  }: UploadFilesDto) {
    const path = this.createPath({ platform, resourceName, resourceId, userId, resourceType })
    const uploadedFiles = await this.storage.uploadMany({
      objects: files.map((file) => {
        const nameSplitted = file.originalname.split('.')
        const extension = nameSplitted.pop()
        const name = nameSplitted.join('.')
        return {
          key: `${path}/${name}-${uuidv4()}.${extension}`,
          file,
        }
      }),
    })

    await this.manager.transaction(async (manager) => {
      const storageBlobRepository = manager.getRepository(StorageBlob)
      const blobInstances = storageBlobRepository.create(
        uploadedFiles.map((file) => ({
          key: file.key,
          byte_size: file.size,
          checksum: file.checksum,
          content_type: file.mimetype,
          filename: file.name,
          metadata: file.metadata,
        })),
      )

      const storageBlobs = await storageBlobRepository.save(blobInstances)

      const storageAttachmentRepository = manager.getRepository(StorageAttachment)
      const storageAttachments = storageAttachmentRepository.create(
        storageBlobs.map((blobRow) => ({
          blob_id: blobRow.id,
          record_id: resourceId,
          record_type: resourceType,
          name: resourceName,
          created_at: new Date(),
        })),
      )

      await storageAttachmentRepository.save(storageAttachments)
    })

    return Promise.all(
      uploadedFiles.map(async (file) => ({
        key: file.key,
        url: await getPresignedUrl(file.key),
      })),
    )
  }

  private createPath({
    platform,
    resourceName,
    resourceId,
    userId,
    resourceType,
  }: {
    platform: string
    resourceName: string
    resourceId: number
    userId?: number
    resourceType?: string
  }) {
    return [platform, resourceName, resourceId, userId, resourceType].filter(Boolean).join('/')
  }
}
