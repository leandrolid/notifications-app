import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Student } from '../../students/entities/student.entity'
import { User } from '../../users/entities/user.entity'
import { Notification } from './notification.entity'

@Entity('notification_addressees')
export class NotificationAddress {
  @PrimaryColumn({
    type: 'int',
    primary: true,
    generated: 'increment',
  })
  id: number

  @Column()
  notification_id: number

  @Column()
  user_id: number

  @Column({
    nullable: true,
    type: 'timestamp',
  })
  received_date: Date

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @Column({
    nullable: true,
  })
  classroom_id: number

  @Column({
    default: 1,
  })
  status: number

  @ManyToOne(() => Notification, (notification) => notification.notification_addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'notification_id' })
  notification: Notification

  @ManyToOne(() => Student, (student) => student.notifications, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'user_id' })
  student?: Student

  @ManyToOne(() => User, (student) => student.notifications, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'user_id' })
  educator?: User
}
