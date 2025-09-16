import { IUseCase } from '@/core/ports/UseCase.interface';
import { IUserRepository } from '@/features/auth/domain/repositories/UserRepository.interface';
import { DeleteUserResponse } from '../models/UserResponse.model';

export interface DeleteUserRequest {
  id: string;
}

export class DeleteUserUseCase implements IUseCase<DeleteUserRequest, DeleteUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    // TODO: Validate user ID format
    // TODO: Check if user exists
    // TODO: Check if user can be deleted (no dependencies)
    // TODO: Perform soft delete (set status to inactive)
    // TODO: Or hard delete if required by business rules
    // TODO: Update related entities if needed
    // TODO: Save changes via repository
    // TODO: Log user deletion action
    // TODO: Return success message
    // TODO: Handle not found errors
    // TODO: Handle constraint violation errors
    // TODO: Handle business rule violations
    
    throw new Error('TODO: Implement DeleteUserUseCase');
  }
}