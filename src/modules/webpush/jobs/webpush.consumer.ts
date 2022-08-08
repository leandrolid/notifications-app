import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { sendNotification } from 'web-push'
import { DatasourceManager } from '../../../decorators/datasource.decorator'
import { WebpushSubscription } from '../entities/webpush-subscription.entity'
import { SendWebpushDto } from './webpush.producer'

type SendWebpushQueueDto = Omit<SendWebpushDto, 'user_list'> & { user_id: number }

@Processor('send-notification-queue')
export class WebpushConsumer {
  constructor(private readonly datasourcemanager: DatasourceManager) {}

  @Process()
  async notify(job: Job<SendWebpushQueueDto>) {
    const { data } = job

    const manager = await this.datasourcemanager.getPlatform(data.platform)
    const webpushRepository = manager.getRepository(WebpushSubscription)
    const subscriptions = await webpushRepository.find({
      where: {
        user_id: data.user_id,
      },
    })

    return Promise.all(
      subscriptions.map((subscription) => {
        return sendNotification(
          subscription.subscription,
          JSON.stringify({
            title: data.title,
            text: data.text,
            url: data.url,
            tag: data.tag,
          }),
          {
            vapidDetails: {
              subject: process.env.VAPI_MAIL!,
              publicKey: process.env.VAPIDKEYS_PUBLIC!,
              privateKey: process.env.VAPIDKEYS_PRIVATE!,
            },
          },
        )
      }),
    )
  }
}
