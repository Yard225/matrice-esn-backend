import { BaseEntity } from '../../domain/entities/base.entity';

export interface IRepository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  save(entity: T): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
}

export interface IPaginatedRepository<T extends BaseEntity> extends IRepository<T> {
  findPaginated(
    page: number,
    limit: number,
    filters?: Record<string, any>,
    sort?: Record<string, 'ASC' | 'DESC'>
  ): Promise<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}