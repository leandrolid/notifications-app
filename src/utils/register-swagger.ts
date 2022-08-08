import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export const registerSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Hercules Node API')
    .setDescription('Hercules Node API initial version using NestJS and TypeORM.')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
}
