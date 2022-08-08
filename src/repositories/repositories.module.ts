import { Module } from '@nestjs/common'
import { DatasourceManagerProvider } from '../decorators/datasource.decorator'
import { ManagerProvider } from '../decorators/manager.decorator'
import { NotificationAddressRepository } from './notification-address.repository'
import { NotificationRepository } from './notification.repository'
import { StudentRepository } from './student.repository'
import { UserRepository } from './user.repository'
import { WebpushSubscriptionRepository } from './webpush-subscription.repository'

const repositories = [
  DatasourceManagerProvider,
  ManagerProvider,
  NotificationRepository,
  NotificationAddressRepository,
  UserRepository,
  StudentRepository,
  WebpushSubscriptionRepository,
]

@Module({
  providers: repositories,
  exports: repositories,
})
export class RepositoriesModule {}
