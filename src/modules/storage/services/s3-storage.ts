import { S3 } from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import { getPresignedUrl } from '../../../utils/get-presigned-url'
import {
  Storage,
  UploadManyParams,
  UploadManyResponse,
  UploadOneParams,
  UploadOneResponse,
} from './storage'

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

@Injectable()
export class S3Storage implements Storage {
  async uploadOne({ key, file }: UploadOneParams): Promise<UploadOneResponse> {
    const res = await s3.putObject({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    })

    return {
      key,
      url: await getPresignedUrl(key),
      checksum: res.ChecksumSHA256!,
      metadata: res.$metadata,
      size: file.size,
      mimetype: file.mimetype,
      name: file.originalname,
    }
  }

  async uploadMany({ objects }: UploadManyParams): Promise<UploadManyResponse> {
    const res = await Promise.all(
      objects.map((object) =>
        s3.putObject({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: object.key,
          Body: object.file.buffer,
          ContentType: object.file.mimetype,
          ACL: 'public-read',
        }),
      ),
    )

    return Promise.all(
      res.map(async (output, index) => {
        const object = objects[index]
        return {
          key: object.key,
          url: await getPresignedUrl(object.key),
          checksum: output.ChecksumSHA256!,
          metadata: output.$metadata,
          size: object.file.size,
          mimetype: object.file.mimetype,
          name: object.file.originalname,
        }
      }),
    )
  }
}
