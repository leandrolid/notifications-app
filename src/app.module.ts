import { ExpressAdapter } from '@bull-board/express'
import { BullBoardModule } from '@bull-board/nestjs'
import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import * as expressBasicAuth from 'express-basic-auth'
import { getDatabasesConfig } from './db/typeorm'
import { AuthGuard } from './modules/auth/auth.guard'
import { NotificationsModule } from './modules/notifications/notifications.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      middleware: expressBasicAuth({
        users: {
          webpush_server: process.env.WEBPUSH_SERVER_PASSWORD || 'webpush_server_password',
        },
        challenge: true,
      }),
      adapter: ExpressAdapter,
    }),
    ...getDatabasesConfig(),
    NotificationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
