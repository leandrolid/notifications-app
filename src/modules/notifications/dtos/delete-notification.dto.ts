import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export const deleteNotificationSchema = z.object({
  notification_id: z.number(),
})

export class DeleteNotificationDto implements z.infer<typeof deleteNotificationSchema> {
  @ApiProperty()
  notification_id: number
}
