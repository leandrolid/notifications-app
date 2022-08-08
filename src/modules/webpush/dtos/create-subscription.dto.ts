import { ApiProperty } from '@nestjs/swagger'
import { z } from 'zod'

export const createSubscriptionSchema = z.object({
  user_id: z.number(),
  client: z.object({
    endpoint: z.string(),
    expirationTime: z.string().nullish(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
})

export class CreateSubscriptionDto implements z.infer<typeof createSubscriptionSchema> {
  @ApiProperty()
  user_id: number

  @ApiProperty({
    properties: {
      endpoint: { type: 'string' },
      expirationTime: { type: 'string' },
      keys: {
        type: 'object',
        properties: {
          p256dh: { type: 'string' },
          auth: { type: 'string' },
        },
      },
    },
  })
  client: {
    endpoint: string
    expirationTime: string | null
    keys: {
      p256dh: string
      auth: string
    }
  }
}
