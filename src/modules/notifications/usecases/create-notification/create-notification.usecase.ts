import { Injectable } from '@nestjs/common'
import { EntityManager, In, Repository } from 'typeorm'
import { BaseDto } from '../../../../types/base.dto'
import { HttpResponses } from '../../../../utils/default-responses'
import { UploadFileUseCase } from '../../../storage/usecases/upload-file/upload-file.usecase'
import { UploadFilesUseCase } from '../../../storage/usecases/upload-files/upload-files.usecase'
import { Student } from '../../../students/entities/student.entity'
import { WebpushProducer } from '../../../webpush/jobs/webpush.producer'
import { CreateNotificationDto } from '../../dtos/create-notification.dto'
import { NotificationAddress } from '../../entities/notification-addresses.entity'
import { Notification } from '../../entities/notification.entity'
import { NotificationReceiverType } from '../../enums/notification-receiver-type.enum'

type CreateAddressesParams = {
  notification_id: number
  data: CreateNotificationDto
  platform: string
}

@Injectable()
export class CreateNotificationUseCase {
  private notificationRepository: Repository<Notification>
  private notificationAddressRepository: Repository<NotificationAddress>
  private studentRepository: Repository<Student>
  constructor(
    private readonly manager: EntityManager,
    private readonly webpushProducer: WebpushProducer,
    private readonly uploadFile: UploadFileUseCase,
    private readonly uploadFiles: UploadFilesUseCase,
  ) {}

  async execute({ platform, user, ...data }: BaseDto<CreateNotificationDto>) {
    await this.manager.transaction(async (manager) => {
      this.prepareRepositories(manager)
      const notification = this.notificationRepository.create({
        text: data.text,
        subject: data.subject,
        signed_by: data.signed_by,
        list_type: data.list_type,
        user_id: user.user_id,
        user_role: user.user_role,
        school_id: user.school,
        created_at: new Date(),
        updated_at: new Date(),
      })
      const notificationRow = await this.notificationRepository.save(notification)

      if (data.header_blob) {
        await this.uploadFile.execute({
          file: data.header_blob,
          platform,
          resourceName: 'notifications',
          resourceId: notificationRow.id,
          resourceType: 'header',
        })
      }

      if (data.files_blob) {
        await this.uploadFiles.execute({
          files: data.files_blob,
          platform,
          resourceName: 'notifications',
          resourceId: notificationRow.id,
          resourceType: 'files',
        })
      }

      const createAddresses = await this.createAddresses({
        notification_id: notificationRow.id,
        data,
        platform,
      })

      await this.notificationRepository.update(
        { id: notificationRow.id },
        { total_sent: createAddresses.length },
      )
    })

    return HttpResponses.CREATED
  }

  async createAddresses(params: CreateAddressesParams) {
    switch (params.data.list_type) {
      case NotificationReceiverType.singleClassroom:
        return this.createSingleClassroomAddresses(params)
      case NotificationReceiverType.multipleClassrooms:
        return this.createMultipleClassroomsAddresses(params)
      default:
        return this.createEducatorAddresses(params)
    }
  }

  async createSingleClassroomAddresses({ notification_id, data, platform }: CreateAddressesParams) {
    const students = await this.studentRepository.find({
      where: {
        user_id: In(data.addresses_list),
        status: 1,
      },
      select: ['user_id', 'classroom_id'],
    })

    const addresses = this.notificationAddressRepository.create(
      students.map((student) => ({
        user_id: student.user_id,
        classroom_id: student.classroom_id,
        notification_id: notification_id,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    )

    await this.webpushProducer.sendWebpush({
      platform,
      user_list: students.map((student) => student.user_id),
      title: data.subject,
      text: data.text,
    })

    return this.notificationAddressRepository.save(addresses)
  }

  async createMultipleClassroomsAddresses({
    notification_id,
    data,
    platform,
  }: CreateAddressesParams) {
    const students = await this.studentRepository.find({
      where: {
        classroom_id: In(data.classrooms ?? []),
        status: 1,
      },
      select: ['user_id', 'classroom_id'],
    })

    const addresses = this.notificationAddressRepository.create(
      students.map((student) => ({
        user_id: student.user_id,
        classroom_id: student.classroom_id,
        notification_id: notification_id,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    )

    await this.webpushProducer.sendWebpush({
      platform,
      user_list: students.map((student) => student.user_id),
      title: data.subject,
      text: data.text,
    })

    return this.notificationAddressRepository.save(addresses)
  }

  async createEducatorAddresses({ notification_id, data }: CreateAddressesParams) {
    const addresses = this.notificationAddressRepository.create(
      data.addresses_list.map((educator) => ({
        user_id: +educator,
        notification_id: notification_id,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    )

    return this.notificationAddressRepository.save(addresses)
  }

  private prepareRepositories(manager: EntityManager) {
    this.notificationRepository = manager.getRepository(Notification)
    this.notificationAddressRepository = manager.getRepository(NotificationAddress)
    this.studentRepository = manager.getRepository(Student)
  }
}
