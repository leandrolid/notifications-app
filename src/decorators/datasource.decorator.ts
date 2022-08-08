import { Inject, Provider, Scope } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { getEntityManagerToken } from '@nestjs/typeorm'
import { EntityManager } from 'typeorm'

export const Datasource = () => Inject('DATASOURCE_MANAGER')

export class DatasourceManager {
  constructor(private moduleRef: ModuleRef) {}

  async getPlatform(platform: string): Promise<EntityManager> {
    return this.moduleRef.get(getEntityManagerToken(`database-${platform}`), {
      strict: false,
    })
  }
}

export const DatasourceManagerProvider: Provider<DatasourceManager> = {
  provide: DatasourceManager,
  scope: Scope.REQUEST,
  inject: [ModuleRef],
  useFactory: (moduleRef: ModuleRef) => new DatasourceManager(moduleRef),
}
