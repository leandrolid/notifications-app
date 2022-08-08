import { Injectable } from '@nestjs/common'
import { NotificationAddressRepository } from '../../../../repositories/notification-address.repository'
import { BaseDto } from '../../../../types/base.dto'
import { DeliveredNotificationsDto } from '../../dtos/delivered-notifications.dto'

@Injectable()
export class DeliveredNotificationsUseCase {
  constructor(private readonly notificationAddressRepository: NotificationAddressRepository) {}

  async execute({ notification_id }: BaseDto<DeliveredNotificationsDto>) {
    const address = await this.notificationAddressRepository.findOne({
      where: { notification_id },
    })

    const isReceiverStudent = !!address?.classroom_id

    if (isReceiverStudent) {
      const studentNotifications = await this.notificationAddressRepository.find({
        where: { notification_id },
        relations: {
          student: {
            classroom: true,
            user: true,
          },
        },
      })

      return studentNotifications.map((notification) => ({
        id: notification.id,
        received_date: notification.received_date,
        classroom: notification.student?.classroom.name,
        name: notification.student?.user.name,
      }))
    }

    const educatorNotifications = await this.notificationAddressRepository.find({
      where: { notification_id },
      relations: {
        educator: true,
      },
    })

    return educatorNotifications.map((notification) => ({
      id: notification.id,
      received_date: notification.received_date,
      name: notification.educator?.name ?? 'N/A',
    }))
  }
}
