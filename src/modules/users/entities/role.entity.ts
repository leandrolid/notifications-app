import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity('roles')
export class Role {
  @PrimaryColumn({
    type: 'int',
    primary: true,
    generated: 'increment',
  })
  id: number

  @Column()
  name: string

  @Column()
  description: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}
