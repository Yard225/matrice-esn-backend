import { IPaginatedRepository } from '@/core/application/interfaces/repository.interface';
import { Email } from '@/core/domain/value-objects/email.vo';
import { User } from '../entities/user.entity';

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