import { IntRange } from '../../../types/int-range'

export enum Role {
  b2c_student = 'b2c_student',
  private_student = 'private_student',
  private_teacher = 'private_teacher',
  school_student = 'school_student',
  school_teacher = 'school_teacher',
  school_coordinator = 'school_coordinator',
  school_admin = 'school_admin',
  back_office = 'back_office',
  secretary = 'secretary',
  master_pedagogy = 'master_pedagogy',
  super_admin = 'super_admin',
  school_assistant = 'school_assistant',
  guardian = 'guardian',
}

export abstract class RoleHelper {
  private static readonly rolesMap = {
    1: Role.b2c_student,
    2: Role.private_student,
    3: Role.private_teacher,
    4: Role.school_student,
    5: Role.school_teacher,
    6: Role.school_coordinator,
    7: Role.school_admin,
    8: Role.back_office,
    9: Role.secretary,
    10: Role.master_pedagogy,
    12: Role.super_admin,
    13: Role.school_assistant,
    14: Role.guardian,
  } as const

  private static readonly rolesMapByName = Object.entries(RoleHelper.rolesMap).reduce(
    (acc, [key, value]) => ({ ...acc, [value]: key }),
    {},
  )

  static getName(id: IntRange<1, 14>) {
    return this.rolesMap[id]
  }

  static getId(name: Role) {
    return this.rolesMapByName[name]
  }
}
