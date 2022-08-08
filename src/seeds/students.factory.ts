import { Faker } from '@faker-js/faker'
import { setSeederFactory } from 'typeorm-extension'
import { Student } from '../modules/students/entities/student.entity'

export const StudentsFactory = setSeederFactory(Student, (faker: Faker) => {
  const student: Partial<Student> = {
    created_at: faker.date.recent(),
    updated_at: faker.date.recent(),
    daily_challenge: faker.date.recent(),
    grade_id: faker.number.int({ max: 1000 }),
    school_id: faker.number.int({ max: 1000 }),
  }

  return Object.assign(new Student(), student)
})
