import { IPaginatedRepository } from '@/core/ports/Repository.interface';
import { Email } from '@/features/auth/domain/value-objects/Email.vo';
import { User } from '../entities/user.entity';

export const I_USER_REPOSITORY = 'I_USER_REPOSITORY';

export interface IUserRepository extends IPaginatedRepository<User> {
  findByEmail(email: Email): Promise<User | null>;
  findByResetPasswordToken(token: string): Promise<User | null>;
  existsByEmail(email: Email): Promise<boolean>;
  findActiveUsers(): Promise<User[]>;
  findByRole(role: string): Promise<User[]>;
  findByDepartment(department: string): Promise<User[]>;
  countByDepartment(department: string): Promise<number>;
  updateLastLoginAt(userId: string, loginAt: Date): Promise<void>;
}
