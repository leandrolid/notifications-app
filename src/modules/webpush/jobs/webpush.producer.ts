import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bull'

export type SendWebpushDto = {
  platform: string
  user_list: Array<number>
  title: string
  text: string
  url?: string
  tag?: string
}

@Injectable()
export class WebpushProducer {
  constructor(@InjectQueue('send-notification-queue') private notificationQueue: Queue) {}

  async sendWebpush(payload: SendWebpushDto) {
    try {
      await Promise.all(
        payload.user_list.map((user) =>
          this.notificationQueue.add(
            { ...payload, user_id: user },
            {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 1000,
              },
            },
          ),
        ),
      )
      return true
    } catch {
      return false
    }
  }
}
