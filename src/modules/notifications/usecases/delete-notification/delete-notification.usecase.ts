import { Injectable, NotFoundException } from '@nestjs/common'
import { EntityManager, Repository } from 'typeorm'
import { BaseDto } from '../../../../types/base.dto'
import { HttpResponses } from '../../../../utils/default-responses'
import { DeleteNotificationDto } from '../../dtos/delete-notification.dto'
import { NotificationAddress } from '../../entities/notification-addresses.entity'
import { Notification } from '../../entities/notification.entity'
import { NotificationStatus } from '../../enums/notification-status.enum'

@Injectable()
export class DeleteNotificationUseCase {
  private notificationRepository: Repository<Notification>
  private notificationAddressRepository: Repository<NotificationAddress>
  constructor(private readonly manager: EntityManager) {}

  async execute({ notification_id, user }: BaseDto<DeleteNotificationDto>) {
    return this.manager.transaction(async (manager) => {
      this.prepareRepositories(manager)
      const isAuthor = await this.isAuthor(user.user_id, notification_id)
      const isReceiver = await this.isReceiver(user.user_id, notification_id)

      if (!isAuthor && !isReceiver) {
        throw new NotFoundException(HttpResponses.NOT_FOUND.message)
      }

      if (isAuthor) {
        await this.notificationRepository.update(
          { id: notification_id },
          { status: NotificationStatus.deleted },
        )

        await this.notificationAddressRepository.update(
          { notification_id },
          { status: NotificationStatus.deleted },
        )
      } else {
        await this.notificationAddressRepository.update(
          { notification_id },
          { status: NotificationStatus.deleted },
        )
      }
    })
  }

  private async isAuthor(user_id: number, notification_id: number) {
    return this.notificationRepository.exists({
      where: { id: notification_id, user_id },
    })
  }

  private async isReceiver(user_id: number, notification_id: number) {
    return this.notificationAddressRepository.exists({
      where: { notification_id: notification_id, user_id },
    })
  }

  private prepareRepositories(manager: EntityManager) {
    this.notificationRepository = manager.getRepository(Notification)
    this.notificationAddressRepository = manager.getRepository(NotificationAddress)
  }
}
