import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { Classroom } from './classroom.entity'

@Entity('classrooms_users')
export class ClassroomUser {
  @PrimaryColumn({
    type: 'int',
    primary: true,
    generated: 'increment',
  })
  id: number

  @PrimaryColumn()
  user_id: number

  @PrimaryColumn()
  classroom_id: number

  @Column({
    default: 1,
  })
  status: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Classroom)
  @JoinColumn({ name: 'classroom_id' })
  classroom: Classroom
}
