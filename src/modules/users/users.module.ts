import { Module } from '@nestjs/common'
import { RepositoriesModule } from '../../repositories/repositories.module'
import { GetUserAvatar } from './usecases/get-user-avatar/get-user-avatar.usecase'

@Module({
  imports: [RepositoriesModule],
  controllers: [],
  providers: [GetUserAvatar],
  exports: [GetUserAvatar],
})
export class UsersModule {}
