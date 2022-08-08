import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export const archiveNotificationSchema = z.object({
  notification_id: z.number(),
})

export class ArchiveNotificationDto implements z.infer<typeof archiveNotificationSchema> {
  @ApiProperty()
  notification_id: number
}
