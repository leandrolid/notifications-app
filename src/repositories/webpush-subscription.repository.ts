import { Injectable } from '@nestjs/common'
import { EntityManager, Repository } from 'typeorm'
import { WebpushSubscription } from '../modules/webpush/entities/webpush-subscription.entity'

@Injectable()
export class WebpushSubscriptionRepository extends Repository<WebpushSubscription> {
  constructor(manager: EntityManager) {
    super(WebpushSubscription, manager)
  }
}
