import { BullAdapter } from '@bull-board/api/bullAdapter'
import { BullBoardModule } from '@bull-board/nestjs'
import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { RepositoriesModule } from '../../repositories/repositories.module'
import { WebpushConsumer } from './jobs/webpush.consumer'
import { WebpushProducer } from './jobs/webpush.producer'
import { CreateSubscriptionController } from './usecases/create-subscription/create-subscription.controller'
import { CreateSubscriptionUseCase } from './usecases/create-subscription/create-subscription.usecase'
import { CreateWebpushController } from './usecases/send-webpush/send-webpush.controller'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'send-notification-queue',
    }),
    BullBoardModule.forFeature({
      name: 'send-notification-queue',
      adapter: BullAdapter,
      options: {
        readOnlyMode: process.env.NODE_ENV === 'production',
      },
    }),
    RepositoriesModule,
  ],
  controllers: [CreateSubscriptionController, CreateWebpushController],
  providers: [CreateSubscriptionUseCase, WebpushProducer, WebpushConsumer],
  exports: [WebpushProducer, WebpushConsumer],
})
export class WebpushModule {}
