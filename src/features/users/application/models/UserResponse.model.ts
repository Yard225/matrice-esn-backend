export class PaginationResponse {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly total: number,
    public readonly totalPages: number,
  ) {}
}

export class UserResponse {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly role: string,
    public readonly department: string,
    public readonly position: string,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt?: Date,
  ) {}
}

export class GetUsersResponse {
  constructor(
    public readonly users: UserResponse[],
    public readonly pagination: PaginationResponse,
  ) {}
}

export class CreateUserResponse {
  constructor(
    public readonly user: UserResponse,
    public readonly message: string,
  ) {}
}

export class UpdateUserResponse {
  constructor(
    public readonly user: UserResponse,
    public readonly message: string,
  ) {}
}

export class DeleteUserResponse {
  constructor(
    public readonly message: string,
  ) {}
}