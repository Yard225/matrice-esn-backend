export interface UpdateUserRequestDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  department?: string;
  position?: string;
  status?: 'active' | 'inactive' | 'suspended';
  avatar?: string;
}

export interface UpdateUserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  position: string;
  status: string;
  updatedAt: Date;
}

export interface UpdatePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePasswordResponseDto {
  message: string;
}