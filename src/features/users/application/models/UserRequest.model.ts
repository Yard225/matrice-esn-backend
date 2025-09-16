export class GetUsersRequest {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly search?: string,
    public readonly role?: string,
    public readonly department?: string,
    public readonly status?: 'active' | 'inactive' | 'suspended',
    public readonly sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt',
    public readonly sortOrder?: 'asc' | 'desc',
  ) {}
}

export class CreateUserRequest {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly password: string,
    public readonly role: string,
    public readonly department: string,
    public readonly position: string,
    public readonly startDate?: string,
    public readonly avatar?: string,
  ) {}
}

export class UpdateUserRequest {
  constructor(
    public readonly id: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly email?: string,
    public readonly role?: string,
    public readonly department?: string,
    public readonly position?: string,
    public readonly status?: 'active' | 'inactive' | 'suspended',
    public readonly avatar?: string,
  ) {}
}

export class UpdatePasswordRequest {
  constructor(
    public readonly userId: string,
    public readonly currentPassword: string,
    public readonly newPassword: string,
  ) {}
}