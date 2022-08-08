export abstract class Storage {
  abstract uploadOne(params: UploadOneParams): Promise<UploadOneResponse>
  abstract uploadMany(params: UploadManyParams): Promise<UploadManyResponse>
}

export type UploadOneParams = {
  key: string
  file: Express.Multer.File
}

export type UploadOneResponse = {
  key: string
  url: string
  checksum: string
  metadata: any
  size: number
  mimetype: string
  name: string
}

export type UploadManyParams = {
  objects: Array<UploadOneParams>
}

export type UploadManyResponse = Array<UploadOneResponse>
