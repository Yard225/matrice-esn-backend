type UserResponsePayload = {
  id: string;
  // email: string;
  firstName: string;
  lastName: string;
  role: string;
};

export type UserResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponsePayload;
};

export type VallidateTokenResponse = {};
