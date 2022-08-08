import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { NotificationAddress } from '../../notifications/entities/notification-addresses.entity'
import { StorageAttachment } from '../../storage/entities/storage-attachment.entity'
import { Student } from '../../students/entities/student.entity'

@Entity('users')
export class User {
  @PrimaryColumn({
    type: 'int',
    primary: true,
    generated: 'increment',
  })
  id: number

  @Column()
  name: string

  @Column()
  username: string

  @Column({
    nullable: true,
  })
  email: string

  @Column({
    select: false,
  })
  password_digest: string

  @Column({
    nullable: true,
    type: 'date',
  })
  birthday: Date

  @Column({
    default: 1,
  })
  status: number

  @Column({
    nullable: true,
  })
  iat: number

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @Column()
  external_id: string

  @Column({
    nullable: true,
  })
  updated_by: string

  @Column({
    nullable: true,
  })
  logged_at: Date

  @Column({
    nullable: true,
    default: true,
  })
  virtual_tour: boolean

  @Column({
    nullable: true,
  })
  role_id: number

  @Column({
    nullable: true,
  })
  role_name: string

  @Column({
    default: 'avatar',
    type: 'varchar',
    enum: ['avatar', 'picture'],
  })
  profile_img_type: string

  @Column({
    name: 'load_files',
    nullable: true,
  })
  load_files: boolean

  @Column({
    nullable: true,
  })
  stripe_reference_id: string

  @Column({
    nullable: true,
  })
  preferred_language: string

  @Column({
    nullable: true,
    default: false,
  })
  flexible_menu: boolean

  @Column({
    nullable: true,
  })
  access_code: string

  @OneToOne(() => Student, (student) => student.user)
  student?: Student

  @OneToOne(() => StorageAttachment, (attachment) => attachment.user)
  avatar?: StorageAttachment

  @OneToMany(() => NotificationAddress, (notification) => notification.educator)
  notifications?: NotificationAddress[]
}
