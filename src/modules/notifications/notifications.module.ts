import { Module } from '@nestjs/common'
import { RepositoriesModule } from '../../repositories/repositories.module'
import { StorageModule } from '../storage/storage.module'
import { UsersModule } from '../users/users.module'
import { WebpushModule } from '../webpush/webpush.module'
import { SendNotificationService } from './services/send-notification.service'
import { ArchiveNotificationController } from './usecases/archive-notification/archive-notification.controller'
import { ArchiveNotificationUseCase } from './usecases/archive-notification/archive-notification.usecase'
import { CreateNotificationController } from './usecases/create-notification/create-notification.controller'
import { CreateNotificationUseCase } from './usecases/create-notification/create-notification.usecase'
import { DeleteNotificationController } from './usecases/delete-notification/delete-notification.controller'
import { DeleteNotificationUseCase } from './usecases/delete-notification/delete-notification.usecase'
import { DeliveredNotificationsController } from './usecases/delivered-notifications/delivered-notifications.controller'
import { DeliveredNotificationsUseCase } from './usecases/delivered-notifications/delivered-notifications.usecase'
import { ListNotificationsAmountController } from './usecases/list-notifications-amount/list-notifications-amount.controller'
import { ListNotificationsAmountUseCase } from './usecases/list-notifications-amount/list-notifications-amount.usecase'
import { ListNotificationsController } from './usecases/list-notifications/list-notifications.controller'
import { ListNotificationsUseCase } from './usecases/list-notifications/list-notifications.usecase'
import { ListReceivedNotificationsController } from './usecases/list-received-notifications/list-received-notifications.controller'
import { ListReceivedNotificationsUseCase } from './usecases/list-received-notifications/list-received-notifications.usecase'
import { ListSentNotificationsController } from './usecases/list-sent-notifications/list-sent-notifications.controller'
import { ListSentNotificationsUseCase } from './usecases/list-sent-notifications/list-sent-notifications.usecase'
import { OpenNotificationController } from './usecases/open-notification/open-notification.controller'
import { OpenNotificationUseCase } from './usecases/open-notification/open-notification.usecase'

@Module({
  imports: [WebpushModule, UsersModule, StorageModule, RepositoriesModule],
  controllers: [
    CreateNotificationController,
    ListReceivedNotificationsController,
    ListSentNotificationsController,
    ListNotificationsController,
    ArchiveNotificationController,
    DeleteNotificationController,
    OpenNotificationController,
    DeliveredNotificationsController,
    ListNotificationsAmountController,
  ],
  providers: [
    CreateNotificationUseCase,
    ListReceivedNotificationsUseCase,
    ListSentNotificationsUseCase,
    ListNotificationsUseCase,
    ArchiveNotificationUseCase,
    DeleteNotificationUseCase,
    OpenNotificationUseCase,
    DeliveredNotificationsUseCase,
    ListNotificationsAmountUseCase,
    SendNotificationService,
  ],
  exports: [SendNotificationService],
})
export class NotificationsModule {}
