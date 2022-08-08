import { Column, CreateDateColumn, Entity, OneToOne, PrimaryColumn } from 'typeorm'
import { StorageAttachment } from './storage-attachment.entity'

@Entity('active_storage_blobs')
export class StorageBlob {
  @PrimaryColumn({
    type: 'int',
    generated: 'increment',
  })
  id: number

  @Column()
  key: string

  @Column()
  filename: string

  @Column()
  content_type: string

  @Column()
  metadata: string

  @Column()
  byte_size: number

  @Column()
  checksum: string

  @CreateDateColumn()
  created_at: Date

  @OneToOne(() => StorageAttachment, (attachment) => attachment.blob)
  attachment: StorageAttachment
}
