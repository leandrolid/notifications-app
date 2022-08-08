import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Student } from '../../students/entities/student.entity'

@Entity('classrooms')
export class Classroom {
  @PrimaryColumn({
    type: 'int',
    primary: true,
    generated: 'increment',
  })
  id: number

  @Column()
  grade_id: number

  @Column()
  name: string

  @Column()
  description: string

  @Column({
    nullable: true,
  })
  period: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @Column()
  school_id: number

  @Column()
  external_id: string

  @Column({
    default: 1,
  })
  status: number

  @Column({
    type: 'json',
    nullable: true,
  })
  updated_by: object

  @OneToMany(() => Student, (student) => student.classroom)
  students: Student[]
}
