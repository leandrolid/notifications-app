import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

const deliveredNotificationsSchema = z.object({
  notification_id: z.number(),
})

export class DeliveredNotificationsDto implements z.infer<typeof deliveredNotificationsSchema> {
  @ApiProperty()
  notification_id: number
}
