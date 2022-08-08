import { Injectable } from '@nestjs/common'
import { EntityManager, Repository } from 'typeorm'
import { Student } from '../modules/students/entities/student.entity'

@Injectable()
export class StudentRepository extends Repository<Student> {
  constructor(manager: EntityManager) {
    super(Student, manager)
  }
}
