// import { ApiProperty } from '@nestjs/swagger';

// export class UserPayloadDto {
//   @ApiProperty({
//     description: 'User unique identifier',
//     example: '550e8400-e29b-41d4-a716-446655440000',
//   })
//   id: string;

//   @ApiProperty({
//     description: 'User email address',
//     example: 'user@example.com',
//   })
//   email: string;

//   @ApiProperty({
//     description: 'User first name',
//     example: 'John',
//   })
//   firstName: string;

//   @ApiProperty({
//     description: 'User last name',
//     example: 'Doe',
//   })
//   lastName: string;

//   @ApiProperty({
//     description: 'User full name',
//     example: 'John Doe',
//   })
//   fullName: string;

//   @ApiProperty({
//     description: 'User role',
//     example: 'user',
//   })
//   role: string;

//   @ApiProperty({
//     description: 'User department',
//     example: 'IT',
//     required: false,
//   })
//   department?: string;

//   @ApiProperty({
//     description: 'Whether the user account is active',
//     example: true,
//   })
//   isActive: boolean;

//   @ApiProperty({
//     description: 'Last login timestamp',
//     example: '2024-01-01T12:00:00.000Z',
//     required: false,
//   })
//   lastLoginAt?: Date;

//   @ApiProperty({
//     description: 'Account creation timestamp',
//     example: '2024-01-01T00:00:00.000Z',
//   })
//   createdAt: Date;

//   @ApiProperty({
//     description: 'Last update timestamp',
//     example: '2024-01-01T00:00:00.000Z',
//   })
//   updatedAt: Date;
// }

// export class AuthResponseDto {
//   @ApiProperty({
//     description: 'Access token for API authentication',
//     example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
//   })
//   accessToken: string;

//   @ApiProperty({
//     description: 'Refresh token for token renewal',
//     example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
//   })
//   refreshToken: string;

//   @ApiProperty({
//     description: 'Token type',
//     example: 'Bearer',
//   })
//   tokenType: string;

//   @ApiProperty({
//     description: 'Access token expiration time in seconds',
//     example: 900,
//   })
//   expiresIn: number;

//   @ApiProperty({
//     description: 'Authenticated user information',
//     type: UserPayloadDto,
//   })
//   user: UserPayloadDto;

//   constructor(data: {
//     accessToken: string;
//     refreshToken: string;
//     tokenType: string;
//     expiresIn: number;
//     user: UserPayloadDto;
//   }) {
//     Object.assign(this, data);
//   }
// }