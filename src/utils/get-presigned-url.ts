import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

type GetPresignedUrlOptions = {
  contentType?: string
  expiresIn?: number
}

export const getPresignedUrl = (key: string, options: GetPresignedUrlOptions = {}) => {
  const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ResponseContentType: options.contentType,
  })
  return getSignedUrl(client, command, { expiresIn: options.expiresIn ?? 600 })
}
