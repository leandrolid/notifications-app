import { Injectable } from '@nestjs/common'
import { Between, ILike } from 'typeorm'
import { NotificationAddressRepository } from '../../../../repositories/notification-address.repository'
import { NotificationRepository } from '../../../../repositories/notification.repository'
import { BaseDto } from '../../../../types/base.dto'
import { GetUserAvatar } from '../../../users/usecases/get-user-avatar/get-user-avatar.usecase'
import { ListNotificationsDto } from '../../dtos/list-notifications.dto'

@Injectable()
export class ListNotificationsUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationAddressRepository: NotificationAddressRepository,
    private readonly getUserAvatar: GetUserAvatar,
  ) {}

  async execute({ subject, start_date, end_date, user }: BaseDto<ListNotificationsDto>) {
    const searchText = subject ? ILike(`%${subject}%`) : undefined
    const createdAt = start_date && end_date && Between(new Date(start_date), new Date(end_date))

    const received = await this.notificationAddressRepository.find({
      where: {
        user_id: user.user_id,
        notification: {
          text: searchText,
          subject: searchText,
          signed_by: searchText,
          created_at: createdAt,
        },
      },
      relations: {
        notification: true,
      },
      order: {
        created_at: 'desc',
      },
      skip: 0,
      take: Number.MAX_SAFE_INTEGER,
    })

    const sent = await this.notificationRepository.find({
      where: {
        user_id: user.user_id,
        text: searchText,
        subject: searchText,
        signed_by: searchText,
        created_at: createdAt,
      },
      order: {
        created_at: 'desc',
      },
      skip: 0,
      take: Number.MAX_SAFE_INTEGER,
    })

    const notifications = await Promise.all([
      ...received.map(async (address) => ({
        receiver_id: address.user_id,
        notification_id: +address.notification_id,
        name: address.notification.signed_by,
        subject: address.notification.subject,
        avatar_url: await this.getUserAvatar.execute({
          user_id: address.notification.user_id,
          user_role: address.notification.user_role,
        }),
        received_at: address.received_date ? address.received_date : '',
        sent_at: address.notification.created_at,
        status: 'rec',
      })),
      ...sent.map(async (notification) => ({
        receiver_id: notification.user_id,
        notification_id: notification.id,
        name: notification.signed_by,
        subject: notification.subject,
        avatar_url: await this.getUserAvatar.execute({
          user_id: notification.user_id,
          user_role: notification.user_role,
        }),
        received_at: '',
        sent_at: notification.created_at,
        status: 'sent',
      })),
    ])

    return notifications
  }
}
