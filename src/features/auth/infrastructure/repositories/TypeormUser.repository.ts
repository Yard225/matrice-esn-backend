// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Email } from '@/core/domain/value-objects/email.vo';
// import { User } from '../../domain/entities/user.entity';
// import { IUserRepository } from '../../domain/repositories/user.repository.interface';
// import { UserSchema } from '../entities/user.schema';

// @Injectable()
// export class TypeOrmUserRepository implements IUserRepository {
//   constructor(
//     @InjectRepository(UserSchema)
//     private readonly userRepository: Repository<UserSchema>,
//   ) {}

//   async findById(id: string): Promise<User | null> {
//     const userSchema = await this.userRepository.findOne({ where: { id } });
//     return userSchema ? this.toDomain(userSchema) : null;
//   }

//   async findByEmail(email: Email): Promise<User | null> {
//     const userSchema = await this.userRepository.findOne({ 
//       where: { email: email.value } 
//     });
//     return userSchema ? this.toDomain(userSchema) : null;
//   }

//   async findByResetPasswordToken(token: string): Promise<User | null> {
//     const userSchema = await this.userRepository.findOne({ 
//       where: { resetPasswordToken: token } 
//     });
//     return userSchema ? this.toDomain(userSchema) : null;
//   }

//   async existsByEmail(email: Email): Promise<boolean> {
//     const count = await this.userRepository.count({ 
//       where: { email: email.value } 
//     });
//     return count > 0;
//   }

//   async findActiveUsers(): Promise<User[]> {
//     const userSchemas = await this.userRepository.find({ 
//       where: { isActive: true } 
//     });
//     return userSchemas.map(schema => this.toDomain(schema));
//   }

//   async findByRole(role: string): Promise<User[]> {
//     const userSchemas = await this.userRepository.find({ 
//       where: { role } 
//     });
//     return userSchemas.map(schema => this.toDomain(schema));
//   }

//   async findByDepartment(department: string): Promise<User[]> {
//     const userSchemas = await this.userRepository.find({ 
//       where: { department } 
//     });
//     return userSchemas.map(schema => this.toDomain(schema));
//   }

//   async countByDepartment(department: string): Promise<number> {
//     return this.userRepository.count({ where: { department } });
//   }

//   async updateLastLoginAt(userId: string, loginAt: Date): Promise<void> {
//     await this.userRepository.update(userId, { lastLoginAt: loginAt });
//   }

//   async findAll(): Promise<User[]> {
//     const userSchemas = await this.userRepository.find();
//     return userSchemas.map(schema => this.toDomain(schema));
//   }

//   async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
//     const userSchema = this.userRepository.create(this.toSchema(userData as User));
//     const savedSchema = await this.userRepository.save(userSchema);
//     return this.toDomain(savedSchema);
//   }

//   async save(user: User): Promise<User> {
//     const userSchema = this.toSchema(user);
//     const savedSchema = await this.userRepository.save(userSchema);
//     return this.toDomain(savedSchema);
//   }

//   async update(id: string, updates: Partial<User>): Promise<User> {
//     await this.userRepository.update(id, updates as any);
//     const updatedSchema = await this.userRepository.findOne({ where: { id } });
//     if (!updatedSchema) {
//       throw new Error('User not found after update');
//     }
//     return this.toDomain(updatedSchema);
//   }

//   async delete(id: string): Promise<void> {
//     await this.userRepository.delete(id);
//   }

//   async exists(id: string): Promise<boolean> {
//     const count = await this.userRepository.count({ where: { id } });
//     return count > 0;
//   }

//   async count(): Promise<number> {
//     return this.userRepository.count();
//   }

//   async findPaginated(
//     page: number,
//     limit: number,
//     filters?: Record<string, any>,
//     sort?: Record<string, 'ASC' | 'DESC'>
//   ): Promise<{
//     items: User[];
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   }> {
//     const queryBuilder = this.userRepository.createQueryBuilder('user');

//     // Apply filters
//     if (filters) {
//       Object.entries(filters).forEach(([key, value]) => {
//         if (value !== undefined && value !== null) {
//           queryBuilder.andWhere(`user.${key} = :${key}`, { [key]: value });
//         }
//       });
//     }

//     // Apply sorting
//     if (sort) {
//       Object.entries(sort).forEach(([key, direction]) => {
//         queryBuilder.addOrderBy(`user.${key}`, direction);
//       });
//     }

//     // Apply pagination
//     const skip = (page - 1) * limit;
//     queryBuilder.skip(skip).take(limit);

//     const [userSchemas, total] = await queryBuilder.getManyAndCount();
//     const items = userSchemas.map(schema => this.toDomain(schema));

//     return {
//       items,
//       total,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//     };
//   }

//   // Mapping methods
//   private toDomain(schema: UserSchema): User {
//     const email = Email.create(schema.email);
//     const user = new User(
//       email,
//       schema.firstName,
//       schema.lastName,
//       schema.password,
//       schema.role,
//       schema.department,
//       schema.createdBy
//     );

//     // Map properties
//     user.id = schema.id;
//     user.isActive = schema.isActive;
//     user.lastLoginAt = schema.lastLoginAt;
//     user.resetPasswordToken = schema.resetPasswordToken;
//     user.resetPasswordExpires = schema.resetPasswordExpires;
//     user.createdAt = schema.createdAt;
//     user.updatedAt = schema.updatedAt;
//     user.updatedBy = schema.updatedBy;
//     user.deletedAt = schema.deletedAt;
//     user.deletedBy = schema.deletedBy;

//     return user;
//   }

//   private toSchema(user: User): Partial<UserSchema> {
//     return {
//       id: user.id,
//       email: user.email.value,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       password: user.password,
//       role: user.role,
//       department: user.department,
//       isActive: user.isActive,
//       lastLoginAt: user.lastLoginAt,
//       resetPasswordToken: user.resetPasswordToken,
//       resetPasswordExpires: user.resetPasswordExpires,
//       createdBy: user.createdBy,
//       updatedBy: user.updatedBy,
//       deletedAt: user.deletedAt,
//       deletedBy: user.deletedBy,
//       createdAt: user.createdAt,
//       updatedAt: user.updatedAt,
//     };
//   }
// }