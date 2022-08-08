import { Injectable } from '@nestjs/common'
import { WebpushSubscriptionRepository } from '../../../../repositories/webpush-subscription.repository'
import { BaseDto } from '../../../../types/base.dto'
import { HttpResponses } from '../../../../utils/default-responses'
import { CreateSubscriptionDto } from '../../dtos/create-subscription.dto'

@Injectable()
export class CreateSubscriptionUseCase {
  constructor(private readonly webpushSubscriptionRepository: WebpushSubscriptionRepository) {}

  async execute({ client, user_id }: BaseDto<CreateSubscriptionDto>) {
    const alreadySubscribed = await this.webpushSubscriptionRepository.exists({
      where: { user_id, endpoint: client.endpoint },
    })

    if (alreadySubscribed) {
      return HttpResponses.NOT_MODIFIED
    }

    const subscription = this.webpushSubscriptionRepository.create({
      user_id,
      endpoint: client.endpoint,
      subscription: client,
    })

    await this.webpushSubscriptionRepository.save(subscription)

    return HttpResponses.CREATED
  }
}
