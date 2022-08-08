import { ExpressAdapter } from '@bull-board/express'
import { BullBoardModule } from '@bull-board/nestjs'
import { faker } from '@faker-js/faker'
import { BullModule } from '@nestjs/bull'
import { HttpStatus } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { Server } from 'net'
import * as request from 'supertest'
import TestAgent from 'supertest/lib/agent'
import { EntityManager } from 'typeorm'
import { getDatabasesConfig } from '../../db/typeorm'
import { HttpResponses } from '../../utils/default-responses'
import { AuthGuard } from '../auth/auth.guard'
import { Role } from '../users/enums/roles.enum'
import { CreateSubscriptionDto } from './dtos/create-subscription.dto'
import { WebpushSubscription } from './entities/webpush-subscription.entity'
import { WebpushModule } from './webpush.module'

const makeRoute = (configs: { path: string }) => {
  const url = new URL(configs.path, 'http://localhost:9999')
  return url.pathname
}

const platform = 'notifications'
const createSubscription: Partial<CreateSubscriptionDto> = {
  user_id: 1,
  client: {
    endpoint: faker.internet.url(),
    expirationTime: null,
    keys: {
      p256dh: faker.string.alphanumeric(20),
      auth: faker.string.alphanumeric(20),
    },
  },
}
const user = {
  user_id: 1,
  user_role: Role.school_student,
  user_name: faker.person.fullName(),
  platform,
  school: faker.number.int({ max: 1000 }),
}

describe('Notifications Module (e2e)', () => {
  let server: Server
  let agent: TestAgent<request.Test>
  let entityManager: EntityManager
  let jwtService: JwtService
  let token = ''

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        JwtModule.register({
          global: true,
          secret: 'test',
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
          adapter: ExpressAdapter,
        }),
        ...getDatabasesConfig((client) => client.platform === platform),
        WebpushModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    }).compile()

    const app = moduleFixture.createNestApplication()
    entityManager = await app.resolve(EntityManager)
    jwtService = app.get(JwtService)
    token = jwtService.sign(user)
    server = await app.listen(9998)
    agent = request.agent(server)
  })

  afterEach((done) => {
    entityManager
      .getRepository(WebpushSubscription)
      .delete({})
      .then(() => server && server.close(done))
  })

  test('(POST) /webpush/subscriptions/create should create a subscription', () => {
    return agent
      .post(makeRoute({ path: '/webpush/subscriptions/create' }))
      .query({ platform })
      .auth(token, { type: 'bearer' })
      .send(createSubscription)
      .expect(HttpStatus.CREATED)
      .expect(HttpResponses.CREATED)
  })

  test('(POST) /webpush/subscriptions/create should not create a subscription with invalid "user_id"', () => {
    return agent
      .post(makeRoute({ path: '/webpush/subscriptions/create' }))
      .query({ platform })
      .auth(token, { type: 'bearer' })
      .send({ ...createSubscription, user_id: null })
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: 'user_id: Expected number, received null',
        error: HttpResponses.BAD_REQUEST.message,
        statusCode: HttpStatus.BAD_REQUEST,
      })
  })

  test('(POST) /webpush/subscriptions/create should not create a subscription with invalid "client"', () => {
    return agent
      .post(makeRoute({ path: '/webpush/subscriptions/create' }))
      .query({ platform })
      .auth(token, { type: 'bearer' })
      .send({ ...createSubscription, client: null })
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: 'client: Expected object, received null',
        error: HttpResponses.BAD_REQUEST.message,
        statusCode: HttpStatus.BAD_REQUEST,
      })
  })

  test('(POST) /webpush/subscriptions/create should make no changes when called with same "user_id" and "client"', async () => {
    await agent
      .post(makeRoute({ path: '/webpush/subscriptions/create' }))
      .query({ platform })
      .auth(token, { type: 'bearer' })
      .send(createSubscription)
      .expect(HttpStatus.CREATED)
      .expect(HttpResponses.CREATED)

    await agent
      .post(makeRoute({ path: '/webpush/subscriptions/create' }))
      .query({ platform })
      .auth(token, { type: 'bearer' })
      .send(createSubscription)
      .expect(HttpStatus.CREATED)
      .expect(HttpResponses.NOT_MODIFIED)
  })
})
