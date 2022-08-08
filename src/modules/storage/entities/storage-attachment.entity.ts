import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm'
import { Notification } from '../../notifications/entities/notification.entity'
import { User } from '../../users/entities/user.entity'
import { StorageBlob } from './storage-blob.entity'

@Entity('active_storage_attachments')
export class StorageAttachment {
  @PrimaryColumn({
    type: 'int',
    generated: 'increment',
  })
  id: number

  @Column()
  name: string

  @Column()
  record_type: string

  @Column()
  record_id: number

  @Column()
  blob_id: number

  @CreateDateColumn()
  created_at: Date

  @OneToOne(() => StorageBlob, (blob) => blob.attachment)
  @JoinColumn({ name: 'blob_id' })
  blob: StorageBlob

  @OneToOne(() => User, (user) => user.avatar, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'record_id' })
  user: User

  @ManyToOne(() => Notification, (user) => user.files, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'record_id' })
  notification?: Notification
}
