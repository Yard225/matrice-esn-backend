export interface GetUsersQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  department?: string;
  status?: 'active' | 'inactive' | 'suspended';
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponseDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface GetUsersResponseDto {
  users: UserResponseDto[];
  pagination: PaginationResponseDto;
}