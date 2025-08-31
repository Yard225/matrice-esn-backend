
import { UserRequest } from '../models/Request.model';
import { UserResponse } from '../models/Response.model';
import { IUserRepository } from '../../domain/repositories/UserRepository.interface';
import { IPasswordService } from '../../domain/services/HashingService.interface';
import { InvalidCredentialsException } from '../../domain/exceptions/InvalidCredentials.exception';
import { ITokenStrategy } from '../../domain/services/TokenService.interface';
import { UserNotFoundException } from '../../domain/exceptions/UserNotFound.exception';
import { AccountDeactivatedException } from '@/features/auth/domain/exceptions/AccountDeactivated.exception';
import { IUseCase } from '@/core/ports/UseCase.interface';

export class LoginUseCase implements IUseCase<UserRequest, UserResponse> {
  constructor(
    private readonly repository: IUserRepository,
    private readonly hashService: IPasswordService,
    private readonly tokenService: ITokenStrategy,
  ) {}

  async execute({ email, password }: UserRequest): Promise<UserResponse> {
    const user = await this.repository.findByEmail(email);

    if (!user)
      throw new UserNotFoundException(
        `User with this email ${email} is not found`,
        'EMAIL_NOT_FOUND',
      );

    if (!user.props.isActive)
      throw new AccountDeactivatedException('Account is deactivated');

    const isVerifiedPassword = await this.hashService.verify(
      password,
      user.props.password,
    );

    if (!isVerifiedPassword)
      throw new InvalidCredentialsException('Invalid credentials provided');

    user.updateLastLogin();
    this.repository.save(user);

    const payload = {
      sub: user.props.id,
      role: user.props.role,
      firstName: user.props.firstName,
      lastName: user.props.lastName,
    };

    const accessToken = await this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.tokenService.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 60 * 15,
      user: {
        id: payload.sub,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
      },
    };
  }
}
