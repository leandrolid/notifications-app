import { Inject, Provider, Scope } from '@nestjs/common'
import { ModuleRef, REQUEST } from '@nestjs/core'
import { getEntityManagerToken } from '@nestjs/typeorm'
import { Request } from 'express'
import { EntityManager } from 'typeorm'

export const Manager = () => Inject('MANAGER')

export const ManagerProvider: Provider<EntityManager> = {
  // provide: 'MANAGER',
  provide: EntityManager,
  inject: [REQUEST, ModuleRef],
  scope: Scope.REQUEST,
  useFactory: (request: Request, moduleRef: ModuleRef) => {
    const platform = request?.query['platform'] || 'notifications'
    return moduleRef.get(getEntityManagerToken(`database-${platform}`), {
      strict: false,
    })
  },
}
