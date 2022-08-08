import { ApiProperty } from '@nestjs/swagger'
import { Readable } from 'stream'
import { z } from 'zod'
import { NotificationReceiverType } from '../enums/notification-receiver-type.enum'

export const createNotificationSchema = z
  .object({
    subject: z.string().min(1),
    text: z.string().min(1),
    signed_by: z.string().min(1),
    addresses_list: z
      .array(z.any())
      .min(1, 'Array must contain at least 1 element')
      .transform((v) => v.map(Number)),
    classrooms: z
      .array(z.any())
      .min(1, 'Array must contain at least 1 element')
      .transform((v) => v.map(Number))
      .nullish(),
    list_type: z
      .string()
      .transform(Number)
      .refine(
        (v) => Object.values(NotificationReceiverType).includes(v),
        'Invalid enum value. Expected 1 | 2 | 3 | 4',
      )
      .nullish(),
    header_blob: z
      .object({
        fieldname: z.string(),
        originalname: z.string(),
        mimetype: z.string(),
        size: z.number(),
        stream: z.instanceof(Readable),
        destination: z.string(),
        filename: z.string(),
        path: z.string(),
        buffer: z.instanceof(Buffer),
      })
      .nullish()
      .or(z.string().max(0)),
    files_blob: z
      .array(
        z.object({
          fieldname: z.string(),
          originalname: z.string(),
          mimetype: z.string(),
          size: z.number(),
          stream: z.instanceof(Readable),
          destination: z.string(),
          filename: z.string(),
          path: z.string(),
          buffer: z.instanceof(Buffer),
        }),
      )
      .nullish(),
  })
  .refine((dto) => {
    if (dto.list_type === NotificationReceiverType.singleClassroom && !dto.addresses_list?.length)
      return false
    if (dto.list_type === NotificationReceiverType.multipleClassrooms && !dto.classrooms?.length)
      return false
    return true
  }, 'Invalid combination of list_type and addresses_list/classrooms')

export class CreateNotificationDto implements z.infer<typeof createNotificationSchema> {
  @ApiProperty()
  subject: string

  @ApiProperty()
  text: string

  @ApiProperty()
  signed_by: string

  @ApiProperty({
    type: [Number],
  })
  addresses_list: number[]

  @ApiProperty({
    type: [Number],
  })
  classrooms: number[]

  @ApiProperty()
  list_type: NotificationReceiverType

  @ApiProperty({ type: 'string', format: 'binary' })
  header_blob?: Express.Multer.File

  @ApiProperty({ type: 'string', format: 'binary', isArray: true })
  files_blob?: Express.Multer.File[]
}
