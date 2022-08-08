import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { StorageAttachment } from '../../storage/entities/storage-attachment.entity'
import { NotificationAddress } from './notification-addresses.entity'

@Entity('notifications')
export class Notification {
  @PrimaryColumn({
    type: 'int',
    primary: true,
    generated: 'increment',
  })
  id: number

  @Column({
    nullable: true,
  })
  user_id: number

  @Column()
  subject: string

  @Column()
  text: string

  @Column()
  signed_by: string

  @Column()
  school_id: number

  @Column({
    default: 1,
  })
  status: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @Column({
    nullable: true,
  })
  list_type: number

  @Column({
    nullable: true,
  })
  user_role: string

  @Column({
    nullable: true,
  })
  ref_notification: number

  @Column({
    nullable: true,
    default: 0,
  })
  total_sent: number

  @Column({
    nullable: true,
    default: 0,
  })
  total_received: number

  @Column({
    nullable: true,
    type: 'jsonb',
    default: null,
    name: 'addressees_info',
  })
  addresses_info: {
    grades: number[]
    school_ids: number[]
  }

  @Column({
    nullable: true,
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  send_at: Date

  @OneToMany(() => NotificationAddress, (notificationAddress) => notificationAddress.notification, {
    onDelete: 'CASCADE',
  })
  notification_addresses: NotificationAddress[]

  @OneToMany(() => StorageAttachment, (storageAttachment) => storageAttachment.notification)
  files?: StorageAttachment[]
}
