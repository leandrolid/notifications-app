import { Faker } from '@faker-js/faker'
import { setSeederFactory } from 'typeorm-extension'
import { Classroom } from '../modules/classrooms/entities/classroom.entity'

export const ClassroomsFactory = setSeederFactory(Classroom, (faker: Faker) => {
  const classroom: Partial<Classroom> = {
    created_at: faker.date.recent(),
    updated_at: faker.date.recent(),
    description: faker.lorem.sentence(),
    external_id: faker.string.uuid(),
    grade_id: faker.number.int({ max: 1000 }),
    name: faker.lorem.words(),
    period: faker.helpers.arrayElement(['Manhã', 'Tarde', 'Noite']),
    school_id: faker.number.int({ max: 1000 }),
  }

  return Object.assign(new Classroom(), classroom)
})
