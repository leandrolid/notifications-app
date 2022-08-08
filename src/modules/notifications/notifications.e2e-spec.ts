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
import { EntityManager, In } from 'typeorm'
import { getDatabasesConfig } from '../../db/typeorm'
import { HttpResponses } from '../../utils/default-responses'
import { AuthGuard } from '../auth/auth.guard'
import { StorageAttachment } from '../storage/entities/storage-attachment.entity'
import { StorageBlob } from '../storage/entities/storage-blob.entity'
import { Storage } from '../storage/services/storage'
import { Role } from '../users/enums/roles.enum'
import { WebpushProducer } from '../webpush/jobs/webpush.producer'
import { NotificationAddress } from './entities/notification-addresses.entity'
import { Notification } from './entities/notification.entity'
import { NotificationReceiverType } from './enums/notification-receiver-type.enum'
import { NotificationStatus } from './enums/notification-status.enum'
import { NotificationsModule } from './notifications.module'

const platform = 'notifications'
const createNotification = {
  subject: faker.word.words(5),
  text: faker.lorem.text(),
  signed_by: faker.person.fullName(),
  addresses_list: [1, 2, 3, 4, 5],
  list_type: NotificationReceiverType.singleClassroom,
}
const user = {
  user_id: 6,
  user_role: Role.school_teacher,
  user_name: faker.person.fullName(),
  platform,
  school: faker.number.int({ max: 1000 }),
}

const makePayload = () => ({
  ...user,
  user_role: Role.school_student,
  user_id: faker.helpers.arrayElement(createNotification.addresses_list),
})

const makeStorageBlob = () => ({
  key: faker.string.uuid(),
  url: faker.internet.url(),
  checksum: faker.internet.password(),
  metadata: '',
  size: faker.number.int({ max: 1000 }),
  mimetype: faker.lorem.word(),
  name: faker.lorem.word(),
})

describe('Notifications Module (e2e)', () => {
  let server: Server
  let agent: TestAgent<request.Test>
  let entityManager: EntityManager
  let jwtService: JwtService
  let token = ''
  let webpushJob: WebpushProducer
  let storage: Storage

  const cleanupDb = async () => {
    await entityManager.getRepository(Notification).delete({})
    await entityManager.getRepository(StorageAttachment).delete({})
    await entityManager.getRepository(StorageBlob).delete({})
  }

  const makeAgent = ({
    path,
    method,
    params = {},
    body,
    customToken,
    isFormdata,
  }: {
    path: string
    method: 'get' | 'post' | 'patch' | 'delete'
    params?: Record<string, any>
    body?: Record<string, any>
    customToken?: string
    isFormdata?: boolean
  }) => {
    const request = agent[method](path)
      .query({ platform, ...params })
      .auth(customToken ?? token, { type: 'bearer' })

    if (isFormdata && body) {
      Object.entries(body).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => request.field(`${key}[]`, v))
          return
        }
        request.field(key, value)
      })
    }

    if (!isFormdata && body) {
      request.send(body)
    }

    return request
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
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
        ...getDatabasesConfig(),
        NotificationsModule,
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
    server = await app.listen(9999)
    agent = request.agent(server)
    webpushJob = app.get(WebpushProducer)
    storage = app.get(Storage)
  })

  afterEach((done) => {
    jest.restoreAllMocks()
    cleanupDb().then(() => server.close(done))
  })

  test.only('(POST) /notifications/create should create a notification', () => {
    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })
      .expect(HttpStatus.CREATED)
      .expect(HttpResponses.CREATED)
  })

  test('(POST) /notifications/create should create a webpush notification', () => {
    const sendWebpushSpy = jest.spyOn(webpushJob, 'sendWebpush')
    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })
      .expect(HttpStatus.CREATED)
      .expect(async () => {
        const expectedPayload = {
          platform,
          user_list: createNotification.addresses_list,
          title: createNotification.subject,
          text: createNotification.text,
        }
        expect(sendWebpushSpy).toHaveBeenCalledTimes(1)
        expect(sendWebpushSpy).toHaveBeenCalledWith(expectedPayload)
        expect(sendWebpushSpy.mock.results[0].value).resolves.toBe(true)
      })
  })

  test('(POST) /notifications/create should create a attachment registry for "header_blob"', () => {
    jest.spyOn(storage, 'uploadOne').mockImplementation(() => Promise.resolve(makeStorageBlob()))

    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })
      .attach('header_blob', 'test/fixtures/bg.png')
      .expect(HttpStatus.CREATED)
      .expect(async (res) => {
        expect(res.body).toStrictEqual(HttpResponses.CREATED)

        const notification = await entityManager.getRepository(Notification).findOneOrFail({
          where: { user_id: user.user_id },
        })
        const attachemntRepository = entityManager.getRepository(StorageAttachment)
        const attachment = await attachemntRepository.findOne({
          where: { record_id: notification.id },
        })
        expect(attachment).not.toBeNull()
      })
  })

  test('(POST) /notifications/create should create attachment registries for "files_blob"', () => {
    jest
      .spyOn(storage, 'uploadMany')
      .mockImplementation(() =>
        Promise.resolve(Array.from({ length: 3 }).map(() => makeStorageBlob())),
      )

    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })
      .attach('files_blob', 'test/fixtures/bg.png')
      .attach('files_blob', 'test/fixtures/bg-login.png')
      .attach('files_blob', 'test/fixtures/homolog-logo.png')
      .expect(HttpStatus.CREATED)
      .expect(async (res) => {
        expect(res.body).toStrictEqual(HttpResponses.CREATED)

        const notification = await entityManager.getRepository(Notification).findOneOrFail({
          where: { user_id: user.user_id },
        })
        const attachemntRepository = entityManager.getRepository(StorageAttachment)
        const attachment = await attachemntRepository.find({
          where: { record_id: notification.id },
        })
        expect(attachment).not.toBeNull()
        expect(attachment.length).toEqual(3)
      })
  })

  test('(POST) /notifications/create should not create a notification with invalid "subject"', () => {
    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: { ...createNotification, subject: '' },
    })
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: 'subject: String must contain at least 1 character(s)',
        error: 'Bad Request',
        statusCode: 400,
      })
  })

  test('(POST) /notifications/create should not create a notification with invalid "text"', () => {
    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: { ...createNotification, text: '' },
    })
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: 'text: String must contain at least 1 character(s)',
        error: 'Bad Request',
        statusCode: 400,
      })
  })

  test('(POST) /notifications/create should not create a notification with invalid "signed_by"', () => {
    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: { ...createNotification, signed_by: '' },
    })
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: 'signed_by: String must contain at least 1 character(s)',
        error: 'Bad Request',
        statusCode: 400,
      })
  })

  test('(POST) /notifications/create should not create a notification with invalid "addresses_list"', () => {
    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: { ...createNotification, addresses_list: [] },
    })
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: 'addresses_list: Required',
        error: 'Bad Request',
        statusCode: 400,
      })
  })

  test('(POST) /notifications/create should not create a notification with invalid "list_type"', () => {
    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: { ...createNotification, list_type: 0 },
    })
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: 'list_type: Invalid enum value. Expected 1 | 2 | 3 | 4',
        error: 'Bad Request',
        statusCode: 400,
      })
  })

  test('(POST) /notifications/create should create addresses list for students listed when "list_type" is "1"', () => {
    const addresses_list = [1, 2]
    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: {
        ...createNotification,
        addresses_list,
        list_type: NotificationReceiverType.singleClassroom,
      },
    })
      .expect(HttpStatus.CREATED)
      .expect(async () => {
        const addresses = await entityManager
          .getRepository(NotificationAddress)
          .find({ where: { user_id: In(addresses_list) } })
        expect(addresses).toHaveLength(2)
      })
  })

  test('(POST) /notifications/create should create addresses list for students listed when "list_type" is "2"', () => {
    const classrooms = [1, 2]
    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: {
        ...createNotification,
        addresses_list: [0],
        classrooms,
        list_type: NotificationReceiverType.multipleClassrooms,
      },
    })
      .expect(HttpStatus.CREATED)
      .expect(async () => {
        const addresses = await entityManager
          .getRepository(NotificationAddress)
          .find({ where: { classroom_id: In(classrooms) } })
        expect(addresses).toHaveLength(4)
      })
  })

  test('(POST) /notifications/create should create addresses list for users listed when "list_type" is "3" or "4"', () => {
    const addresses_list = [1]
    return makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: {
        ...createNotification,
        addresses_list,
        list_type: NotificationReceiverType.teachers,
      },
    })
      .expect(HttpStatus.CREATED)
      .expect(async () => {
        const addresses = await entityManager
          .getRepository(NotificationAddress)
          .find({ where: { user_id: In(addresses_list) } })
        expect(addresses).toHaveLength(1)
      })
  })

  test('(GET) /notifications/received should return a list of notifications received', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    return makeAgent({
      path: '/notifications/received',
      method: 'get',
      params: { subject: '' },
      customToken: jwtService.sign(makePayload()),
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([
          {
            avatar_url: expect.any(String),
            name: expect.any(String),
            notification_id: expect.any(Number),
            received_at: expect.any(String),
            receiver_id: expect.any(Number),
            sent_at: expect.any(String),
            status: 'rec',
            subject: expect.any(String),
          },
        ])
      })
  })

  test('(GET) /notifications/received should return a list of notifications received filtered by text', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    await makeAgent({
      path: '/notifications/received',
      method: 'get',
      params: { subject: 'NOT_FOUND_TEXT' },
      customToken: jwtService.sign(makePayload()),
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([])
      })

    return makeAgent({
      path: '/notifications/received',
      method: 'get',
      params: { subject: '' },
      customToken: jwtService.sign(makePayload()),
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([
          {
            avatar_url: expect.any(String),
            name: expect.any(String),
            notification_id: expect.any(Number),
            received_at: expect.any(String),
            receiver_id: expect.any(Number),
            sent_at: expect.any(String),
            status: 'rec',
            subject: expect.any(String),
          },
        ])
      })
  })

  test('(GET) /notifications/received should return a list of notifications received filtered by date', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    return makeAgent({
      path: '/notifications/received',
      method: 'get',
      params: {
        start_date: new Date('2020-01-01').toISOString(),
        end_date: new Date('2020-01-01').toISOString(),
      },
      customToken: jwtService.sign(makePayload()),
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([])
      })
  })

  test('(GET) /notifications/received should return a list of notifications received with status archived', async () => {
    const receiver = makePayload()
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    await entityManager
      .getRepository(NotificationAddress)
      .update({ user_id: receiver.user_id }, { status: NotificationStatus.archived })

    return makeAgent({
      path: '/notifications/received',
      method: 'get',
      params: { platform, status: 'archived' },
      customToken: jwtService.sign(receiver),
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([
          {
            avatar_url: expect.any(String),
            name: expect.any(String),
            notification_id: expect.any(Number),
            received_at: expect.any(String),
            receiver_id: expect.any(Number),
            sent_at: expect.any(String),
            status: 'rec',
            subject: expect.any(String),
          },
        ])
      })
  })

  test('(GET) /notifications/received should return a list of notifications unread', async () => {
    const receiver = makePayload()
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    return makeAgent({
      path: '/notifications/received',
      method: 'get',
      params: { status: 'unread' },
      customToken: jwtService.sign(receiver),
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([
          {
            avatar_url: expect.any(String),
            name: expect.any(String),
            notification_id: expect.any(Number),
            received_at: '',
            receiver_id: expect.any(Number),
            sent_at: expect.any(String),
            status: 'rec',
            subject: expect.any(String),
          },
        ])
      })
  })

  test('(GET) /notifications/received should return a list of notifications read', async () => {
    const receiver = makePayload()
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    return makeAgent({
      path: '/notifications/received',
      method: 'get',
      params: { status: 'read' },
      customToken: jwtService.sign(receiver),
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([])
      })
  })

  test('(GET) /notifications/sent should return a list of notifications sent', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    return makeAgent({
      path: '/notifications/sent',
      method: 'get',
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([
          {
            avatar_url: expect.any(String),
            name: expect.any(String),
            notification_id: expect.any(Number),
            received_at: expect.any(String),
            receiver_id: user.user_id,
            sent_at: expect.any(String),
            status: 'sent',
            subject: expect.any(String),
          },
        ])
        expect(res.body).toHaveLength(1)
      })
  })

  test('(GET) /notifications/sent should return a list of notifications sent filtered by text', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    return makeAgent({
      path: '/notifications/sent',
      method: 'get',
      params: { subject: 'NOT_FOUND_TEXT' },
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([])
      })
  })

  test('(GET) /notifications/sent should return a list of notifications sent filtered by date', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    return makeAgent({
      path: '/notifications/sent',
      method: 'get',
      params: {
        start_date: new Date('2020-01-01').toISOString(),
        end_date: new Date('2020-01-01').toISOString(),
      },
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([])
      })
  })

  test('(GET) /notifications/sent should return a list of notifications sent with status archived', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    await entityManager
      .getRepository(Notification)
      .update({ user_id: user.user_id }, { status: NotificationStatus.archived })

    return makeAgent({
      path: '/notifications/sent',
      method: 'get',
      params: { status: 'archived' },
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual(
          expect.arrayContaining([
            {
              avatar_url: expect.any(String),
              name: expect.any(String),
              notification_id: expect.any(Number),
              received_at: expect.any(String),
              receiver_id: user.user_id,
              sent_at: expect.any(String),
              status: 'sent',
              subject: expect.any(String),
            },
          ]),
        )
        expect(res.body).toHaveLength(1)
      })
  })

  test('(GET) /notifications should return a list of notifications sent and received', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      customToken: jwtService.sign({ ...user, user_id: user.user_id + 1 }),
      body: {
        ...createNotification,
        addresses_list: [user.user_id],
        list_type: NotificationReceiverType.teachers,
      },
    })

    return makeAgent({
      path: '/notifications',
      method: 'get',
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([
          {
            avatar_url: expect.any(String),
            name: expect.any(String),
            notification_id: expect.any(Number),
            received_at: expect.any(String),
            receiver_id: user.user_id,
            sent_at: expect.any(String),
            status: 'rec',
            subject: expect.any(String),
          },
          {
            avatar_url: expect.any(String),
            name: expect.any(String),
            notification_id: expect.any(Number),
            received_at: expect.any(String),
            receiver_id: expect.any(Number),
            sent_at: expect.any(String),
            status: 'sent',
            subject: expect.any(String),
          },
        ])
        expect(res.body).toHaveLength(2)
      })
  })

  test('(GET) /notifications should return a list of notifications sent and received filtered by text', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      customToken: jwtService.sign({ ...user, user_id: user.user_id + 1 }),
      body: { ...createNotification, addresses_list: [user.user_id] },
    })

    return makeAgent({
      path: '/notifications',
      method: 'get',
      params: {
        subject: 'NOT_FOUND_TEXT',
      },
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([])
        expect(res.body).toHaveLength(0)
      })
  })

  test('(GET) /notifications should return a list of notifications sent and received filtered by date', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      customToken: jwtService.sign(makePayload()),
      body: { ...createNotification, addresses_list: [user.user_id] },
    })

    return makeAgent({
      path: '/notifications',
      method: 'get',
      params: {
        start_date: new Date('2020-01-01').toISOString(),
        end_date: new Date('2020-01-01').toISOString(),
      },
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual([])
        expect(res.body).toHaveLength(0)
      })
  })

  test('(PATCH) /notifications/archive should change sent notification status to archived', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    const notification = await entityManager.getRepository(Notification).findOneOrFail({
      where: { user_id: user.user_id },
    })

    return makeAgent({
      path: '/notifications/archive',
      method: 'patch',
      body: { notification_id: notification.id },
    })
      .expect(HttpStatus.OK)
      .expect(HttpResponses.OK)
  })

  test('(PATCH) /notifications/archive should change received notification status to archived', async () => {
    const receiver = makePayload()
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    const notification = await entityManager.getRepository(NotificationAddress).findOneOrFail({
      where: { user_id: receiver.user_id },
    })

    return makeAgent({
      path: '/notifications/archive',
      method: 'patch',
      body: { notification_id: notification.notification_id },
      customToken: jwtService.sign(receiver),
    })
      .expect(HttpStatus.OK)
      .expect(HttpResponses.OK)
  })

  test('(PATCH) /notifications/archive should not archive an invalid notification', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    return makeAgent({
      path: '/notifications/archive',
      method: 'patch',
      body: { notification_id: -1 },
    })
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: HttpResponses.NOT_FOUND.message,
        error: HttpResponses.NOT_FOUND.message,
        statusCode: HttpStatus.NOT_FOUND,
      })
  })

  test('(DELETE) /notifications/delete should change received notification status to deleted', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    const notification = await entityManager.getRepository(NotificationAddress).findOneOrFail({
      where: { user_id: createNotification.addresses_list![0] },
    })

    return makeAgent({
      path: '/notifications/delete',
      method: 'delete',
      body: { notification_id: notification.notification_id },
      customToken: jwtService.sign(makePayload()),
    }).expect(HttpStatus.NO_CONTENT)
  })

  test('(DELETE) /notifications/delete should change sent notification status to deleted', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    const notification = await entityManager.getRepository(Notification).findOneOrFail({
      where: { user_id: user.user_id },
    })

    return makeAgent({
      path: '/notifications/delete',
      method: 'delete',
      body: { notification_id: notification.id },
    }).expect(HttpStatus.NO_CONTENT)
  })

  test('(DELETE) /notifications/delete should change sent notifications status to deleted', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    const notification = await entityManager.getRepository(Notification).findOneOrFail({
      where: { user_id: user.user_id },
    })

    return makeAgent({
      path: '/notifications/delete',
      method: 'delete',
      body: { notification_id: notification.id },
    })
      .expect(HttpStatus.NO_CONTENT)
      .expect(async () => {
        const notifications = await entityManager.getRepository(NotificationAddress).find({
          where: { notification_id: notification.id },
        })

        expect(faker.helpers.arrayElement(notifications)).toHaveProperty(
          'status',
          NotificationStatus.deleted,
        )
      })
  })

  test('(DELETE) /notifications/delete should not delete an invalid notification', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    return makeAgent({
      path: '/notifications/delete',
      method: 'delete',
      body: { notification_id: -1 },
    })
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: HttpResponses.NOT_FOUND.message,
        error: HttpResponses.NOT_FOUND.message,
        statusCode: HttpStatus.NOT_FOUND,
      })
  })

  test('(GET) /notifications/details should get the notification details', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    const notification = await entityManager.getRepository(Notification).findOneOrFail({
      where: { user_id: user.user_id },
    })

    return makeAgent({
      path: '/notifications/details',
      method: 'get',
      params: {
        notification_id: notification.id,
      },
      customToken: jwtService.sign(makePayload()),
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual({
          files_url: expect.any(Array),
          image_header_url: expect.any(String),
          list_type: NotificationReceiverType.singleClassroom,
          notification_id: expect.any(Number),
          sent_at: expect.any(String),
          signed_by: expect.any(String),
          status: expect.any(String),
          subject: expect.any(String),
          text: expect.any(String),
        })
      })
  })

  test('(GET) /notifications/details should update received date of notification', async () => {
    const receiver = makePayload()
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    const notification = await entityManager.getRepository(NotificationAddress).findOneOrFail({
      where: { user_id: receiver.user_id },
    })

    return makeAgent({
      path: '/notifications/details',
      method: 'get',
      params: {
        notification_id: notification.notification_id,
      },
      customToken: jwtService.sign(receiver),
    })
      .expect(HttpStatus.OK)
      .expect(async () => {
        expect(notification.received_date).toBe(null)
        const updatedNotification = await entityManager
          .getRepository(NotificationAddress)
          .findOneOrFail({
            where: { user_id: receiver.user_id },
          })
        expect(updatedNotification.received_date).not.toBe(null)
      })
  })

  test('(GET) /notifications/details should update total received of notification', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    const notification = await entityManager.getRepository(Notification).findOneOrFail({
      where: { user_id: user.user_id },
    })

    return makeAgent({
      path: '/notifications/details',
      method: 'get',
      params: {
        notification_id: notification.id,
      },
      customToken: jwtService.sign(makePayload()),
    })
      .expect(HttpStatus.OK)
      .expect(async () => {
        expect(notification.total_received).toBe(0)
        const updatedNotification = await entityManager.getRepository(Notification).findOneOrFail({
          where: { user_id: user.user_id },
        })
        expect(updatedNotification.total_received).toBe(1)
      })
  })

  test('(GET) /notifications/delivered should list the student reveivers', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: {
        ...createNotification,
        list_type: NotificationReceiverType.singleClassroom,
      },
    })

    const notification = await entityManager.getRepository(Notification).findOneOrFail({
      where: { user_id: user.user_id },
    })

    return makeAgent({
      path: '/notifications/delivered',
      method: 'get',
      params: {
        notification_id: notification.id,
      },
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body[0]).toStrictEqual({
          id: expect.any(Number),
          received_date: null,
          classroom: expect.any(String),
          name: expect.any(String),
        })
        expect(res.body).toHaveLength(5)
      })
  })

  test('(GET) /notifications/delivered should list the educator reveivers', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: {
        ...createNotification,
        list_type: NotificationReceiverType.teachers,
        addresses_list: [user.user_id],
      },
    })

    const notification = await entityManager.getRepository(Notification).findOneOrFail({
      where: { user_id: user.user_id },
    })

    return makeAgent({
      path: '/notifications/delivered',
      method: 'get',
      params: {
        notification_id: notification.id,
      },
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body[0]).toStrictEqual({
          id: expect.any(Number),
          received_date: null,
          name: expect.any(String),
        })
        expect(res.body).toHaveLength(1)
      })
  })

  test('(GET) /notifications/amount should list the amount of each notification type', async () => {
    await makeAgent({
      path: '/notifications/create',
      method: 'post',
      isFormdata: true,
      body: createNotification,
    })

    return makeAgent({
      path: '/notifications/amount',
      method: 'get',
    })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toStrictEqual({
          total_unread: expect.any(Number),
          total_read: expect.any(Number),
          total_sent: 1,
          total_archived: expect.any(Number),
        })
      })
  })
})
