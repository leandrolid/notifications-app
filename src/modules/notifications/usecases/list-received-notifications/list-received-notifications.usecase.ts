import { Injectable } from '@nestjs/common'
import { Between, ILike, IsNull, Not, Or, Raw } from 'typeorm'
import { NotificationAddressRepository } from '../../../../repositories/notification-address.repository'
import { BaseDto } from '../../../../types/base.dto'
import { GetUserAvatar } from '../../../users/usecases/get-user-avatar/get-user-avatar.usecase'
import { ListNotificationsDto } from '../../dtos/list-notifications.dto'
import { NotificationStatus } from '../../enums/notification-status.enum'

const { archived, active } = NotificationStatus

@Injectable()
export class ListReceivedNotificationsUseCase {
  constructor(
    private readonly notificationAddressRepository: NotificationAddressRepository,
    private readonly getUserAvatar: GetUserAvatar,
  ) {}

  async execute({ user, subject, start_date, end_date, status }: BaseDto<ListNotificationsDto>) {
    const searchText = subject ? ILike(`%${subject}%`) : undefined
    const createdAt = start_date && end_date && Between(new Date(start_date), new Date(end_date))
    const entityStatus = status === 'archived' ? archived : active
    const readReceivedDate = status === 'read' ? Not(IsNull()) : undefined
    const unreadReceivedDate = status === 'unread' ? IsNull() : undefined

    const addresses = await this.notificationAddressRepository.find({
      where: [
        {
          user_id: user.user_id,
          status: entityStatus,
          received_date: readReceivedDate ?? unreadReceivedDate,
          notification: {
            school_id: user.school,
            send_at: Or(
              IsNull(),
              Raw((columnAlias) => `${columnAlias} < now()`),
            ),
            text: searchText,
            subject: searchText,
            signed_by: searchText,
            created_at: createdAt,
          },
        },
        {
          user_id: user.user_id,
          status: entityStatus,
          received_date: readReceivedDate ?? unreadReceivedDate,
          notification: {
            addresses_info: Raw((columnAlias) => `${columnAlias} -> 'school_ids' @> :schools`, {
              schools: JSON.stringify([user.school]),
            }),
            send_at: Or(
              IsNull(),
              Raw((columnAlias) => `${columnAlias} < now()`),
            ),
            text: searchText,
            subject: searchText,
            signed_by: searchText,
            created_at: createdAt,
          },
        },
      ],
      relations: {
        notification: true,
      },
      order: {
        created_at: 'desc',
      },
      skip: 0,
      take: Number.MAX_SAFE_INTEGER,
    })

    return Promise.all(
      addresses.map(async (address) => ({
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
    )
  }
}
