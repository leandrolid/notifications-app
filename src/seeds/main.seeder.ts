import { DataSource, In } from 'typeorm'
import { Seeder, SeederFactoryManager } from 'typeorm-extension'
import { ClassroomUser } from '../modules/classrooms/entities/classroom-users.entity'
import { Classroom } from '../modules/classrooms/entities/classroom.entity'
import { Student } from '../modules/students/entities/student.entity'
import { User } from '../modules/users/entities/user.entity'
import { Role, RoleHelper } from '../modules/users/enums/roles.enum'

const CLASSROOMS_AMOUNT = 3
const STUDENTS_AMOUNT = 5
const TEACHERS_AMOUNT = 5

export default class MainSeeder implements Seeder {
  public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
    const classrooms = await this.createClassrooms(factoryManager)
    await this.createStudents(dataSource, factoryManager, classrooms)
    await this.createTeachers(dataSource, factoryManager)
  }

  private async createClassrooms(factoryManager: SeederFactoryManager): Promise<Array<Classroom>> {
    const classroomFactory = factoryManager.get(Classroom)
    return classroomFactory.saveMany(CLASSROOMS_AMOUNT)
  }

  private async createStudents(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
    classrooms: Array<Classroom>,
  ): Promise<Array<Student>> {
    const userFactory = factoryManager.get(User)

    const users = await userFactory.saveMany(STUDENTS_AMOUNT)

    const studentsFactory = factoryManager.get(Student)
    const studentsRepository = dataSource.getRepository(Student)

    const studentsMade = await Promise.all(
      users.map((user, index) =>
        studentsFactory.make({
          user_id: user.id,
          classroom_id: classrooms[index % CLASSROOMS_AMOUNT].id,
        }),
      ),
    )

    const students = await studentsRepository.save(studentsMade)

    const classroomUserFactory = factoryManager.get(ClassroomUser)
    const classroomUserRepository = dataSource.getRepository(ClassroomUser)

    const classroomsUsersMade = await Promise.all(
      students.map((student) =>
        classroomUserFactory.make({
          user_id: student.user_id,
          classroom_id: student.classroom_id,
        }),
      ),
    )

    await classroomUserRepository.save(classroomsUsersMade)

    return students
  }

  private async createTeachers(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<Array<User>> {
    const userFactory = factoryManager.get(User)
    const userRepository = dataSource.getRepository(User)

    const teachers = await userFactory.saveMany(TEACHERS_AMOUNT)

    userRepository.update(
      { id: In(teachers.map((teacher) => teacher.id)) },
      { role_id: RoleHelper.getId(Role.school_teacher), role_name: Role.school_teacher },
    )

    return teachers
  }
}
