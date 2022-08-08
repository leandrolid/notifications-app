import { Injectable } from '@nestjs/common'
import { Between, ILike, In } from 'typeorm'
import { NotificationRepository } from '../../../../repositories/notification.repository'
import { BaseDto } from '../../../../types/base.dto'
import { Role } from '../../../users/enums/roles.enum'
import { GetUserAvatar } from '../../../users/usecases/get-user-avatar/get-user-avatar.usecase'
import { ListNotificationsDto } from '../../dtos/list-notifications.dto'
import { NotificationStatus } from '../../enums/notification-status.enum'

@Injectable()
export class ListSentNotificationsUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly getUserAvatar: GetUserAvatar,
  ) {}

  async execute({ user, subject, start_date, end_date, status }: BaseDto<ListNotificationsDto>) {
    const searchText = subject ? ILike(`%${subject}%`) : undefined
    const createdAt = start_date && end_date && Between(new Date(start_date), new Date(end_date))
    const entityStatus =
      status === 'archived' ? NotificationStatus.archived : NotificationStatus.active

    const notifications = await this.notificationRepository.find({
      where: [
        {
          status: entityStatus,
          school_id: user.school,
          text: searchText,
          subject: searchText,
          signed_by: searchText,
          created_at: createdAt,
          user_id: user.user_id,
          user_role: In([Role.school_assistant, Role.school_coordinator, Role.school_teacher]),
        },
      ],
      order: {
        created_at: 'desc',
      },
      skip: 0,
      take: Number.MAX_SAFE_INTEGER,
    })

    return Promise.all(
      notifications.map(async (notification) => ({
        receiver_id: notification.user_id,
        notification_id: +notification.id,
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
    )
  }
}
