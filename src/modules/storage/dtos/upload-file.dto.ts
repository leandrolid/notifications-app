export type UploadFileDto = {
  file: Express.Multer.File
  platform: string
  resourceName: 'notifications'
  resourceId: number
  resourceType: 'header' | 'files'
  userId?: number
}
