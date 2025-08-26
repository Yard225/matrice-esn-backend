// import {
//   Controller,
//   Post,
//   Body,
//   HttpCode,
//   HttpStatus,
//   UseGuards,
//   Request,
//   Get,
//   Ip,
//   Headers,
// } from '@nestjs/common';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiUnauthorizedResponse,
//   ApiBadRequestResponse,
//   ApiTooManyRequestsResponse,
// } from '@nestjs/swagger';
// import { ApiResponseDto } from '@/core/application/dtos/api-response.dto';
// import { AuthResponseDto } from '../../application/dtos/auth-response.dto';
// import { LoginDto } from '../../application/dtos/login.dto';
// import { ILoginUseCase } from '../../application/interfaces/login-use-case.interface';
// import { LoginModel } from '../../application/models/login.model';

// @ApiTags('Authentication')
// @Controller('auth')
// export class AuthController {
//   constructor(private readonly loginUseCase: ILoginUseCase) {}

//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'User authentication',
//     description: 'Authenticates user with email and password, returns JWT tokens',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Authentication successful',
//     type: AuthResponseDto,
//   })
//   @ApiUnauthorizedResponse({
//     description: 'Invalid credentials or inactive account',
//   })
//   @ApiBadRequestResponse({
//     description: 'Invalid input data',
//   })
//   @ApiTooManyRequestsResponse({
//     description: 'Too many login attempts',
//   })
//   async login(
//     @Body() loginDto: LoginDto,
//     @Ip() clientIp: string,
//     @Headers('user-agent') userAgent: string,
//   ): Promise<ApiResponseDto<AuthResponseDto>> {
//     const loginModel = new LoginModel(loginDto.email, loginDto.password, clientIp, userAgent);
//     const authResult = await this.loginUseCase.execute(loginModel);

//     return ApiResponseDto.success(
//       authResult,
//       'Authentication successful'
//     );
//   }

//   @Post('logout')
//   @HttpCode(HttpStatus.NO_CONTENT)
//   @ApiOperation({
//     summary: 'User logout',
//     description: 'Invalidates user session and tokens',
//   })
//   @ApiResponse({
//     status: 204,
//     description: 'Logout successful',
//   })
//   async logout(): Promise<void> {
//     // TODO: Implement logout logic
//     // This would typically involve:
//     // 1. Invalidating refresh token
//     // 2. Adding access token to blacklist
//     // 3. Clearing session if using sessions
//   }

//   @Get('me')
//   @ApiOperation({
//     summary: 'Get current user profile',
//     description: 'Returns the profile of the authenticated user',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'User profile retrieved successfully',
//   })
//   @ApiUnauthorizedResponse({
//     description: 'Authentication required',
//   })
//   async getCurrentUser(@Request() req): Promise<ApiResponseDto<any>> {
//     // TODO: Implement get current user logic
//     // This would extract user from JWT token
//     return ApiResponseDto.success(req.user, 'User profile retrieved successfully');
//   }

//   @Post('refresh')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({
//     summary: 'Refresh access token',
//     description: 'Generate new access token using refresh token',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Token refreshed successfully',
//   })
//   @ApiUnauthorizedResponse({
//     description: 'Invalid or expired refresh token',
//   })
//   async refreshToken(): Promise<ApiResponseDto<any>> {
//     // TODO: Implement refresh token logic
//     return ApiResponseDto.success({}, 'Token refreshed successfully');
//   }
// }