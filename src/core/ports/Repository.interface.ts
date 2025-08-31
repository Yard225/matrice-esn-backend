import { BaseEntity } from "../base/entities/base.entity";



export const I_REPOSITORY = 'I_REPOSITORY';
export const I_PAGINATED_REPOSITORY = 'I_PAGINATED_REPOSITORY';

export interface IRepository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;
  save(entity: T): Promise<void>;
  update(id: string, updates: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
}

export interface IPaginatedRepository<T extends BaseEntity>
  extends IRepository<T> {
  findPaginated(
    page: number,
    limit: number,
    filters?: Record<string, any>,
    sort?: Record<string, 'ASC' | 'DESC'>,
  ): Promise<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}
