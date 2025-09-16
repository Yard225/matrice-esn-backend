import { Role } from '../entities/Role.entity';
import { IRepository } from '@/core/ports/Repository.interface';

export interface IRoleRepository extends IRepository<Role> {
  // Basic CRUD operations inherited from IRepository
  
  // Role-specific queries
  findByCategory(category: string): Promise<Role[]>;
  findByLevel(level: 'middle' | 'senior' | 'expert'): Promise<Role[]>;
  findBySkill(skill: string): Promise<Role[]>;
  findActiveRoles(): Promise<Role[]>;
  findInactiveRoles(): Promise<Role[]>;
  
  // Search and filtering
  findByNamePattern(pattern: string): Promise<Role[]>;
  findByCategoryAndLevel(category: string, level: 'middle' | 'senior' | 'expert'): Promise<Role[]>;
  searchRoles(query: string, filters?: {
    category?: string;
    level?: 'middle' | 'senior' | 'expert';
    includeSkills?: boolean;
  }): Promise<Role[]>;
  
  // Statistics and aggregation
  countByCategory(): Promise<Record<string, number>>;
  countByLevel(): Promise<Record<string, number>>;
  getSkillsDistribution(): Promise<Record<string, number>>;
  getCategories(): Promise<string[]>;
  
  // Role relationships
  findRolesWithUsers(): Promise<Role[]>;
  findRolesWithInteractions(): Promise<Role[]>;
  
  // Advanced queries
  findPaginatedWithFilters(
    page: number,
    limit: number,
    filters?: {
      category?: string;
      level?: 'middle' | 'senior' | 'expert';
      search?: string;
      includeSkills?: boolean;
    },
    sort?: {
      field: 'name' | 'category' | 'level' | 'createdAt';
      direction: 'asc' | 'desc';
    }
  ): Promise<{
    items: Role[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}