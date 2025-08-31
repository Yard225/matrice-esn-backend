import { Email } from '@/features/auth/domain/value-objects/Email.vo';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../ports/user.repository.interface';

export class InMemoryUserRepository implements IUserRepository {
  constructor(public database: User[] = []) {}

  async save(entity: User): Promise<void> {
    const existingIndex = this.database.findIndex(
      (user) => user.props.id === entity.props.id,
    );

    if (existingIndex >= 0) {
      this.database[existingIndex] = entity;
    } else {
      this.database.push(entity);
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    const user = this.database.find(
      (user) => user.props.email.value === email.value,
    );

    return user ?? null;
  }

  async findByResetPasswordToken(token: string): Promise<User | null> {
    const user = this.database.find(
      (user) => user.resetPasswordToken === token,
    );

    return user ?? null;
  }

  async findActiveUsers(): Promise<User[]> {
    const users = this.database.filter((user) => user.props.isActive);

    return [...users];
  }

  async findByRole(role: string): Promise<User[]> {
    const users = this.database.filter((user) => user.props.role === role);

    return [...users];
  }

  async findByDepartment(department: string): Promise<User[]> {
    const users = this.database.filter(
      (user) => user.props.department === department,
    );

    return [...users];
  }

  async findById(id: string): Promise<User | null> {
    const user = this.database.find((user) => user.props.id === id);

    return user ?? null;
  }

  async findAll(): Promise<User[]> {
    return [...this.database];
  }

  async create(
    entity: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    this.database.push(new User({ ...entity.props }));
  }

  async update(id: string, updates: Partial<User>): Promise<void> {
    const index = this.database.findIndex((user) => user.props.id === id);

    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }

    this.database[index].update(updates.props || {});
  }

  async delete(id: string): Promise<void> {
    const index = this.database.findIndex((user) => user.props.id === id);

    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }

    this.database.splice(index, 1);
  }

  async existsByEmail(email: Email): Promise<boolean> {
    return this.database.some((user) => user.props.email.equals(email));
  }

  async exists(id: string): Promise<boolean> {
    return this.database.some((user) => user.props.id === id);
  }

  async count(): Promise<number> {
    return this.database.length;
  }

  async countByDepartment(department: string): Promise<number> {
    return (await this.findByDepartment(department)).length;
  }

  async updateLastLoginAt(userId: string, _loginAt: Date): Promise<void> {
    const index = this.database.findIndex((user) => user.props.id === userId);

    if (index === -1) {
      throw new Error(`User with id ${userId} not found`);
    }

    this.database[index].updateLastLogin();
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: Record<string, any>,
    sort?: Record<string, 'ASC' | 'DESC'>,
  ): Promise<{
    items: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let filteredData = [...this.database];

    // Apply filters
    if (filters) {
      filteredData = filteredData.filter((user) => {
        return Object.entries(filters).every(([key, value]) => {
          if (key === 'email' && value) {
            return user.props.email.value
              .toLowerCase()
              .includes(value.toLowerCase());
          }

          if (key === 'role' && value) {
            return user.props.role === value;
          }

          if (key === 'department' && value) {
            return user.props.department === value;
          }

          if (key === 'isActive' && typeof value === 'boolean') {
            return user.props.isActive === value;
          }

          return true;
        });
      });
    }

    // Apply sorting
    if (sort) {
      Object.entries(sort).forEach(([key, direction]) => {
        filteredData.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          if (key === 'email') {
            aValue = a.props.email.value;
            bValue = b.props.email.value;
          } else if (key in a.props) {
            aValue = (a.props as any)[key];
            bValue = (b.props as any)[key];
          } else {
            return 0;
          }

          if (direction === 'ASC') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      });
    }

    const total = filteredData.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const items = filteredData.slice(offset, offset + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
