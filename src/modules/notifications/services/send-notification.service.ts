import { Injectable } from '@nestjs/common'
import { UserRepository } from '../../../repositories/user.repository'
import { AuthUserDto } from '../../auth/dtos/auth-user.dto'
import { NotificationReceiverType } from '../enums/notification-receiver-type.enum'
import { CreateNotificationUseCase } from '../usecases/create-notification/create-notification.usecase'

type SendNotificationServiceDto = {
  addresses_list?: number[]
  classrooms?: number[]
  subject: string
  text: string
  signed_by: string
  platform: string
  user: AuthUserDto['user']
  details: {
    type: 'chat' | 'activity'
    contact_id?: number
    url?: string
  }
}

@Injectable()
export class SendNotificationService {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(data: SendNotificationServiceDto) {
    try {
      const type = await this.getNotificationType(data)

      if (type) {
        return this.createNotificationUseCase.execute({
          ...data,
          list_type: type,
        } as any)
      }
    } catch (error) {
      console.error(error)
    }
  }

  private async getNotificationType(data: SendNotificationServiceDto) {
    if (Array.isArray(data.classrooms) && data.classrooms.length) {
      return NotificationReceiverType.multipleClassrooms
    }

    if (Array.isArray(data.addresses_list) && data.addresses_list.length) {
      const user = await this.userRepository.findOne({
        where: { id: data.addresses_list[0] },
        relations: { student: true },
      })

      return user && user.student
        ? NotificationReceiverType.singleClassroom
        : NotificationReceiverType.teachers
    }

    return false
  }
}
