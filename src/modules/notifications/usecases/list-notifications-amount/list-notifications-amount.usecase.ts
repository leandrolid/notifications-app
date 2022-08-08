import { Injectable } from '@nestjs/common'
import { IsNull, Not } from 'typeorm'
import { NotificationAddressRepository } from '../../../../repositories/notification-address.repository'
import { NotificationRepository } from '../../../../repositories/notification.repository'
import { BaseDto } from '../../../../types/base.dto'
import { NotificationStatus } from '../../enums/notification-status.enum'

@Injectable()
export class ListNotificationsAmountUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationAddressRepository: NotificationAddressRepository,
  ) {}

  async execute({ user }: BaseDto) {
    const read = await this.notificationAddressRepository.count({
      where: {
        user_id: user.user_id,
        received_date: Not(IsNull()),
        status: NotificationStatus.active,
        notification: {
          school_id: user.school,
        },
      },
    })

    const unread = await this.notificationAddressRepository.count({
      where: {
        user_id: user.user_id,
        received_date: IsNull(),
        status: NotificationStatus.active,
        notification: {
          school_id: user.school,
        },
      },
    })

    const sent = await this.notificationRepository.count({
      where: {
        user_id: user.user_id,
        status: NotificationStatus.active,
      },
    })

    const [archivedSent, archivedReceived] = await Promise.all([
      this.notificationRepository.count({
        where: {
          user_id: user.user_id,
          status: NotificationStatus.archived,
        },
      }),
      this.notificationAddressRepository.count({
        where: {
          user_id: user.user_id,
          status: NotificationStatus.archived,
        },
      }),
    ])

    return {
      total_read: read,
      total_unread: unread,
      total_sent: sent,
      total_archived: archivedSent + archivedReceived,
    }
  }
}
