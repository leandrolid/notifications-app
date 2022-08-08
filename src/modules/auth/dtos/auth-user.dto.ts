export abstract class AuthUserDto {
  user: {
    user_id: number
    user_role: string
    user_name: string
    iat: number
    platform: string
    school: number
    classroom: number
    grade: number
    exp: number
  }
  token: string
}
