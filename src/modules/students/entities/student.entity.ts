import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Classroom } from '../../classrooms/entities/classroom.entity'
import { NotificationAddress } from '../../notifications/entities/notification-addresses.entity'
import { User } from '../../users/entities/user.entity'

@Entity('students')
export class Student {
  @PrimaryColumn({
    type: 'int',
    primary: true,
    generated: 'increment',
  })
  id: number

  @Column({
    nullable: true,
  })
  classroom_id: number

  @Column()
  user_id: number

  @Column({
    default: 1,
  })
  status: number

  @Column({
    default: 0,
  })
  score_total: number

  @Column({
    default: 0,
  })
  pokz_total: number

  @Column({
    default: 0,
  })
  level: number

  @Column({
    default: 0,
  })
  earned_sticker: number

  @Column({
    default: 0,
  })
  total_points: number

  @Column({
    default: 0,
  })
  total_played: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @Column({
    type: 'date',
    nullable: true,
  })
  daily_challenge: Date

  @Column({
    nullable: true,
  })
  avatar_id: number

  @Column()
  grade_id: number

  @Column()
  school_id: number

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  last_school_year: Date

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {
      hall_of_fame_win: null,
      unique_accesses: 0,
      total_games_played: 0,
      change_photo: null,
      change_password: null,
      complete_profile: null,
    },
  })
  level_up: object

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  social_media_pokz: object

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => Classroom, (classroom) => classroom.students)
  @JoinColumn({ name: 'classroom_id' })
  classroom: Classroom

  @OneToMany(() => NotificationAddress, (notification) => notification.student)
  notifications: NotificationAddress[]
}
