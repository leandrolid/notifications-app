import { Injectable } from '@nestjs/common'
import { EntityManager, Repository } from 'typeorm'
import { NotificationAddress } from '../modules/notifications/entities/notification-addresses.entity'

@Injectable()
export class NotificationAddressRepository extends Repository<NotificationAddress> {
  constructor(manager: EntityManager) {
    super(NotificationAddress, manager)
    return this
  }
}
