import { Injectable } from '@nestjs/common'
import { EntityManager, Repository } from 'typeorm'
import { User } from '../modules/users/entities/user.entity'

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(manager: EntityManager) {
    super(User, manager)
  }
}
