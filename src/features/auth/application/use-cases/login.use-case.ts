import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IUseCase } from '@/core/application/interfaces/use-case.interface';
import { Email } from '@/core/domain/value-objects/email.vo';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IPasswordService } from '../../domain/services/password.service.interface';
import { ITokenService } from '../../domain/services/token.service.interface';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { LoginDto } from '../dtos/login.dto';

@Injectable()
export class LoginUseCase implements IUseCase<LoginDto, AuthResponseDto> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(request: LoginDto): Promise<AuthResponseDto> {
    const { email, password, clientIp, userAgent } = request;

    // Find user by email
    const emailVo = Email.create(email);
    const user = await this.userRepository.findByEmail(emailVo);
    
    if (!user) {
      throw new UserNotFoundException(email, 'email');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.verify(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // Update last login
    user.updateLastLogin();
    await this.userRepository.save(user);

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email.value,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = await this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.tokenService.generateRefreshToken(payload);

    return new AuthResponseDto({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes
      user: {
        id: user.id,
        email: user.email.value,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }
}