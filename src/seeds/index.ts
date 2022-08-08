import 'reflect-metadata'

import { resolve } from 'path'
import { DataSource } from 'typeorm'
import { runSeeders } from 'typeorm-extension'
import { config as baseConfig } from '../db/typeorm'
;(async () => {
  const datasource = new DataSource({
    ...baseConfig,
    dropSchema: process.env.NODE_ENV === 'development',
    synchronize: process.env.NODE_ENV === 'development',
    entities: [resolve(__dirname, '../**/*.entity.{ts,js}')],
    seeds: [resolve(__dirname, './*.seeder.ts')],
    factories: [resolve(__dirname, './*.factory.ts')],
  } as any)
  await datasource.initialize()
  await runSeeders(datasource)
})()
