import { Injectable } from '@nestjs/common'
import { EntityManager } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { getPresignedUrl } from '../../../../utils/get-presigned-url'
import { UploadFileDto } from '../../dtos/upload-file.dto'
import { StorageAttachment } from '../../entities/storage-attachment.entity'
import { StorageBlob } from '../../entities/storage-blob.entity'
import { Storage } from '../../services/storage'

@Injectable()
export class UploadFileUseCase {
  constructor(
    private readonly manager: EntityManager,
    private readonly storage: Storage,
  ) {}

  async execute({ file, platform, resourceName, resourceId, userId, resourceType }: UploadFileDto) {
    const path = this.createPath({ platform, resourceName, resourceId, userId, resourceType })
    const nameSplitted = file.originalname.split('.')
    const extension = nameSplitted.pop()
    const name = nameSplitted.join('.')
    const key = `${path}/${name}-${uuidv4()}.${extension}`
    const uploadedFile = await this.storage.uploadOne({
      key,
      file,
    })

    await this.saveToDatabase({
      platform,
      key,
      byteSize: uploadedFile.size,
      checksum: uploadedFile.checksum!, // uploadedFile.ETag!,
      contentType: uploadedFile.mimetype,
      filename: uploadedFile.name,
      metadata: JSON.stringify(uploadedFile.metadata),
      resourceId,
      resourceType: `${resourceName}_${resourceType}`,
      resourceName,
    })

    return {
      key,
      url: await getPresignedUrl(key),
    }
  }

  private async saveToDatabase({
    key,
    byteSize,
    checksum,
    contentType,
    filename,
    metadata,
    resourceId,
    resourceType,
    resourceName,
  }: {
    platform: string
    key: string
    byteSize: number
    checksum: string
    contentType: string
    filename: string
    metadata: string
    resourceId: number
    resourceType: string
    resourceName: string
  }) {
    return this.manager.transaction(async (manager) => {
      const storageBlobRepository = manager.getRepository(StorageBlob)
      const storageBlob = storageBlobRepository.create({
        key,
        byte_size: byteSize,
        checksum,
        content_type: contentType,
        filename,
        metadata,
      })

      const blobRow = await storageBlobRepository.save(storageBlob)

      const storageAttachmentRepository = manager.getRepository(StorageAttachment)
      const storageAttachment = storageAttachmentRepository.create({
        blob_id: blobRow.id,
        record_id: resourceId,
        record_type: resourceType,
        name: resourceName,
        created_at: new Date(),
      })

      await storageAttachmentRepository.save(storageAttachment)
    })
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
