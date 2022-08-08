import { z } from 'zod'

export const platformSchema = z.string()

const platformSchemaObject = z.object({
  platform: platformSchema,
})

export abstract class PlatformDto implements z.infer<typeof platformSchemaObject> {
  platform: string
}
