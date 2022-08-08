import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export const notificationIdSchema = z.coerce.number()

const openNotificationSchema = z.object({
  notification_id: notificationIdSchema,
})

export class OpenNotificationDto implements z.infer<typeof openNotificationSchema> {
  @ApiProperty()
  notification_id: number
}
