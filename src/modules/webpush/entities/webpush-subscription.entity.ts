import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('webpush_subscriptions')
export class WebpushSubscription {
  @PrimaryColumn({
    type: 'int',
    generated: 'increment',
  })
  id: number

  @Column()
  user_id: number

  @Column()
  endpoint: string

  @Column({
    type: 'jsonb',
  })
  subscription: {
    endpoint: string
    expirationTime: string | null
    keys: {
      p256dh: string
      auth: string
    }
  }

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
