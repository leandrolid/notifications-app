export type UploadFilesDto = {
  files: Array<Express.Multer.File>
  platform: string
  resourceName: 'notifications'
  resourceId: number
  resourceType: 'header' | 'files'
  userId?: number
}
