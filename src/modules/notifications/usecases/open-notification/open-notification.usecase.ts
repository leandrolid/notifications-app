import { Injectable, NotFoundException } from '@nestjs/common'
import { ILike } from 'typeorm'
import { NotificationRepository } from '../../../../repositories/notification.repository'
import { BaseDto } from '../../../../types/base.dto'
import { HttpResponses } from '../../../../utils/default-responses'
import { getPresignedUrl } from '../../../../utils/get-presigned-url'
import { StorageAttachment } from '../../../storage/entities/storage-attachment.entity'
import { OpenNotificationDto } from '../../dtos/open-notification.dto'
import { NotificationAddress } from '../../entities/notification-addresses.entity'
import { Notification } from '../../entities/notification.entity'

@Injectable()
export class OpenNotificationUseCase {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute({ notification_id, user }: BaseDto<OpenNotificationDto>) {
    return this.notificationRepository.manager.transaction(async (manager) => {
      const notificationAddressRepository = manager.getRepository(NotificationAddress)
      const address = await notificationAddressRepository.findOne({
        where: { notification_id },
        relations: {
          notification: true,
        },
      })

      if (!address) {
        throw new NotFoundException(HttpResponses.NOT_FOUND.message)
      }

      if (address.received_date === null) {
        await notificationAddressRepository.update(
          { notification_id, user_id: user.user_id },
          { received_date: new Date() },
        )

        const notificationRepository = manager.getRepository(Notification)
        await notificationRepository.increment({ id: notification_id }, 'total_received', 1)
      }

      const storageAttachmentRepository = manager.getRepository(StorageAttachment)
      const attachments = await storageAttachmentRepository.find({
        where: {
          record_id: notification_id,
          record_type: ILike('notification%'),
        },
        relations: ['blob'],
      })

      const blobs = attachments.reduce(
        (acc, file) => {
          if (/header/i.test(file.record_type)) return { ...acc, header: file.blob.key }
          return { ...acc, files: [...acc.files, file.blob.key] }
        },
        { header: '', files: [] },
      )

      return {
        image_header_url: blobs.header ? await getPresignedUrl(blobs.header) : '',
        notification_id: address.notification_id,
        text: address.notification.text,
        subject: address.notification.subject,
        signed_by: address.notification.signed_by,
        sent_at: address.notification.created_at,
        status: address.notification.user_id === user.user_id ? 'sent' : 'rec',
        list_type: address.notification.list_type,
        files_url: blobs.files
          ? await Promise.all(blobs.files.map((file) => getPresignedUrl(file)))
          : [],
      }
    })
  }
}
