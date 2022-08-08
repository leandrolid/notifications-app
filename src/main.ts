import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { registerSwagger } from './utils/register-swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  registerSwagger(app)
  app.enableCors()
  await app.listen(process.env.PORT || 3000)
}
bootstrap()
