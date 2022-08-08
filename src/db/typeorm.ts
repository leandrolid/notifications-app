import { ConfigModule, ConfigService, registerAs } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { config as dotenvConfig } from 'dotenv'
import { resolve } from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'
import { clientsMap } from './platform_db'

dotenvConfig({ path: '.env' })

export const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  entities: [resolve(__dirname + '/../**/*.entity.{ts,js}')],
  migrations: [resolve(__dirname + '/../migrations/*.{ts,js}')],
  migrationsTableName: 'migrations_typeorm',
  logging: process.env.NODE_ENV === 'development',
  connectTimeoutMS: 20000,
  // ssl: true,
  extra: {
    rejectUnauthorized: false,
  },
}

const registerOrmFactory = registerAs('typeorm', () => {
  return Object.entries(clientsMap).reduce(
    (allConfigs, [platform, database]) => ({
      ...allConfigs,
      [platform]: {
        ...config,
        database: `${database}${process.env.DATABASE_SUFFIX}`,
      },
    }),
    {},
  )
})

type DatabaseFilter = (client: { platform: string; database: string }) => boolean

export const getDatabasesConfig = (filter?: DatabaseFilter) =>
  Object.entries(clientsMap)
    .filter(([platform, database]) => filter?.({ platform, database }) ?? true)
    .map(([platform]) => {
      return TypeOrmModule.forRootAsync({
        name: `database-${platform}`,
        imports: [ConfigModule.forFeature(registerOrmFactory)],
        useFactory: (config: ConfigService) => config.get(`typeorm.${platform}`)!,
        inject: [ConfigService],
      })
    })

export const connectionSource = new DataSource(config)
