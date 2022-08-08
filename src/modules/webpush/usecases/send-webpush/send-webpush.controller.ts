import { Controller, HttpStatus, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Platform } from '../../../../decorators/platform.decorator'
import { HttpResponses } from '../../../../utils/default-responses'
import { WebpushProducer } from '../../jobs/webpush.producer'

@Controller('webpush')
@ApiTags('Webpush')
@ApiBearerAuth()
export class CreateWebpushController {
  constructor(private readonly webpushProducer: WebpushProducer) {}

  @Post('/send')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: HttpResponses.CREATED.message,
  })
  async execute(@Platform() platform: string) {
    return this.webpushProducer.sendWebpush({
      platform,
      user_list: [1994],
      title: 'Lorem ipsum dolor',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    })
  }
}
