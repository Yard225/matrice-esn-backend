import { IUseCase } from '@/core/ports/UseCase.interface';
import { IUserRepository } from '@/features/auth/domain/repositories/UserRepository.interface';
import { IPasswordService } from '@/features/auth/domain/services/HashingService.interface';
import { CreateUserRequest } from '../models/UserRequest.model';
import { CreateUserResponse } from '../models/UserResponse.model';
import { Email } from '@/features/auth/domain/value-objects/Email.vo';

export class CreateUserUseCase implements IUseCase<CreateUserRequest, CreateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    // TODO: Validate request data against CreateUserRequest
    // TODO: Check if email already exists
    // TODO: Validate email format using Email.vo
    // TODO: Hash password before storing using passwordService
    // TODO: Validate role permissions
    // TODO: Validate department exists
    // TODO: Set default status to 'active'
    // TODO: Generate unique user ID
    // TODO: Create User entity with validated data
    // TODO: Save to database via repository
    // TODO: Transform saved entity to response model
    // TODO: Return created user without password
    // TODO: Send welcome email (async)
    // TODO: Log user creation action
    // TODO: Handle database constraint errors
    // TODO: Handle validation errors
    
    throw new Error('TODO: Implement CreateUserUseCase');
  }
}