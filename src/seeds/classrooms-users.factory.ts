import { Faker } from '@faker-js/faker'
import { setSeederFactory } from 'typeorm-extension'
import { ClassroomUser } from '../modules/classrooms/entities/classroom-users.entity'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ClassroomsUsersFactory = setSeederFactory(ClassroomUser, (faker: Faker) => {
  const classroom: Partial<ClassroomUser> = {
    // classroom_id: faker.helpers.arrayElement([1, 2, 3, 4, 5]),
    // user_id: faker.helpers.arrayElement([1, 2, 3, 4, 5]),
  }

  return Object.assign(new ClassroomUser(), classroom)
})
