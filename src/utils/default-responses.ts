import { HttpStatus } from '@nestjs/common'

export abstract class HttpResponses {
  static CREATED = {
    statusCode: HttpStatus.CREATED,
    message: 'Created',
  } as const

  static OK = {
    statusCode: HttpStatus.OK,
    message: 'OK',
  } as const

  static NOT_FOUND = {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'Not Found',
  } as const

  static NO_CONTENT = {
    statusCode: HttpStatus.NO_CONTENT,
    message: 'No Content',
  } as const

  static BAD_REQUEST = {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Bad Request',
  } as const

  static NOT_MODIFIED = {
    statusCode: HttpStatus.NOT_MODIFIED,
    message: 'Not Modified',
  } as const
}
