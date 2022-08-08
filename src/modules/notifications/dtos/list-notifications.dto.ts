import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'
import { ListNotificationStatus } from '../enums/list-notification-status.enum'

export const listNotificationsSchema = z.object({
  subject: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  status: z.enum(['read', 'unread', 'archived']).optional(),
})

export abstract class ListNotificationsDto implements z.infer<typeof listNotificationsSchema> {
  @ApiProperty({ required: false })
  subject: string

  @ApiProperty({ required: false })
  start_date: Date

  @ApiProperty({ required: false })
  end_date: Date

  @ApiProperty({
    required: false,
    enum: ListNotificationStatus,
    enumName: 'ListNotificationStatus',
  })
  status: 'read' | 'unread' | 'archived'
}
