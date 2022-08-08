import { Injectable } from '@nestjs/common'
import { UserRepository } from '../../../../repositories/user.repository'
import { getPresignedUrl } from '../../../../utils/get-presigned-url'
import { Role } from '../../enums/roles.enum'

type GetUserAvatarDto = {
  user_id: number
  user_role: string
}

@Injectable()
export class GetUserAvatar {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(data: GetUserAvatarDto) {
    const jupiterRoles: Array<string> = [
      Role.back_office,
      Role.super_admin,
      Role.secretary,
      Role.school_admin,
    ]

    if (jupiterRoles.includes(data.user_role)) return ''

    const user = await this.userRepository.findOne({
      where: [
        {
          id: data.user_id,
          avatar: {
            record_id: data.user_id,
          },
        },
        {
          id: data.user_id,
          student: {
            user_id: data.user_id,
          },
        },
      ],
      relations: {
        student: true,
        avatar: {
          blob: true,
        },
      },
    })

    if (!user) return ''
    if (user.avatar) return getPresignedUrl(user.avatar.blob.key)
    if (user.student)
      return `https://funserver.com.br/imgs/profile/photos/${user.student.avatar_id}_avatar.jpg`
    return ''
  }
}
