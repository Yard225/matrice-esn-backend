import { User } from '../../domain/entities/User.entity';
import { IUserRepository } from '../../domain/repositories/UserRepository.interface';
import { Email } from '../../domain/value-objects/Email.vo';

export class InMemoryUserRepository implements IUserRepository {
  constructor(public database: User[] = []) {}

  async create(user: User): Promise<void> {
    this.database.push(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.database.find((user) => user.props.email.value === email);

    return user ?? null;
  }

  findByIndex(id: string): number {
    return this.database.findIndex((user) => user.props.id === id);
  }

  async findById(id: string): Promise<User | null> {
    const user = this.database.find((user) => user.props.id === id);

    return user ?? null;
  }

  async findAll(): Promise<User[]> {
    return [...this.database];
  }

  async save(user: User): Promise<void> {
    const index = this.database.findIndex(
      (savedUser) => savedUser.props.id === user.props.id,
    );

    if (index === -1) {
      this.database.push(user);
      return;
    }

    this.database[index] = user;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    return this.database.some((user) => user.props.email.equals(email));
  }

  async deleteById(id: string): Promise<void> {
    const index = this.findByIndex(id);

    if (index >= 0) this.database.splice(index, 1);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const index = this.findByIndex(id);

    if (index >= 0) {
      this.database[index].props.password = hashedPassword;
    }
  }

  async updateLastLogin(id: string, lastLoginAt: Date): Promise<void> {
    const index = this.findByIndex(id);

    if (index >= 0) {
      this.database[index].lastLoginAt = lastLoginAt;
    }
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<void> {
    const index = this.findByIndex(id);

    if (index >= 0) {
      this.database[index].props.isActive = isActive;
    }
  }

  async countActiveUsers(): Promise<number> {
    return [...this.database.filter((user) => user.props.isActive)].length;
  }
}
