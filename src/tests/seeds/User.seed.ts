import { User } from '@/features/auth/domain/entities/User.entity';
import { UserFixtures } from '../fixtures/User.fixture';
import { Email } from '@/features/auth/domain/value-objects/Email.vo';
import { Roles } from '@/features/users/enums/roles.enum';

export const e2eUsers = {
  alice: new UserFixtures(
    new User({
      id: 'id-1',
      email: Email.create('ralice@gmail.com'),
      password: 'Azerty@123',
      firstName: 'alice',
      lastName: 'reynolds',
      role: Roles.USER,
      isActive: true,
    }),
  ),

  bob: new UserFixtures(
    new User({
      id: 'id-2',
      email: Email.create('boblenoir@gmail.com'),
      password: 'Azerty@123',
      firstName: 'bob',
      lastName: 'lenoir',
      role: Roles.USER,
      isActive: true,
    }),
  ),
};
