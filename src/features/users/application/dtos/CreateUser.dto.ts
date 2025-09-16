export interface CreateUserRequestDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  department: string;
  position: string;
  startDate?: string;
  avatar?: string;
}

export interface CreateUserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  position: string;
  status: string;
  createdAt: Date;
}