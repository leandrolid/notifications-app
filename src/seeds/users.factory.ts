import { Faker } from '@faker-js/faker'
import { setSeederFactory } from 'typeorm-extension'
import { User } from '../modules/users/entities/user.entity'
import { Role, RoleHelper } from '../modules/users/enums/roles.enum'

export const UsersFactory = setSeederFactory(User, (faker: Faker) => {
  const user: Partial<User> = {
    name: faker.person.fullName(),
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password_digest: faker.internet.password(),
    birthday: faker.date.past(),
    external_id: faker.string.uuid(),
    role_id: RoleHelper.getId(Role.school_student),
    role_name: Role.school_student,
  }

  return Object.assign(new User(), user)
})
