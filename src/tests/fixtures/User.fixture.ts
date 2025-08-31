import { BaseFixture } from '@/core/base/fixtures/Base.fixture';
import { IFixture } from './ports/Fixture.interface';
import { User } from '@/features/auth/domain/entities/User.entity';
import { TestApp } from '../utils/TestApp';
import {
  I_USER_REPOSITORY,
  IUserRepository,
} from '@/features/auth/domain/repositories/UserRepository.interface';

export class UserFixtures extends BaseFixture<User> implements IFixture {
  async load(app: TestApp): Promise<void> {
    const userRepository = app.get<IUserRepository>(I_USER_REPOSITORY);
    return userRepository.create(this.entity);
  }
}
