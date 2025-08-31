import { LoginUseCase } from '@/features/auth/application/use-cases/LoginUser.usecase';
import { User } from '@/features/auth/domain/entities/User.entity';
import { Email } from '@/features/auth/domain/value-objects/Email.vo';
import { InMemoryUserRepository } from '@/features/auth/infrastructure/repositories/InMemoryUser.repository';
import { BcryptHasherService } from '@/features/auth/infrastructure/services/BcryptHashing.service';
import { JwtStrategy } from '@/features/auth/infrastructure/services/JwtToken.service';
import { Roles } from '@/features/users/enums/roles.enum';

describe('Feature: Login User', () => {
  let useCase: LoginUseCase;
  let repository: InMemoryUserRepository;
  let hashService: BcryptHasherService;
  let tokenService: JwtStrategy;

  const mockJwtService = {
    signAsync: jest.fn()
      .mockResolvedValueOnce('mock-jwt-token')
      .mockResolvedValueOnce('mock-refresh-token'),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
  } as any;

  const mockConfigService = {
    get: jest.fn(),
  } as any;

  beforeEach(async () => {
    tokenService = new JwtStrategy(mockJwtService, mockConfigService);
    hashService = new BcryptHasherService();

    const johnDoe = new User({
      id: 'id-1',
      email: Email.create('johndoe@gmail.com'),
      password: await hashService.hash('Azerty@123'),
      firstName: 'john',
      lastName: 'doe',
      role: Roles.USER,
      isActive: true,
    });

    const AliceReynolds = new User({
      id: 'id-2',
      email: Email.create('ralice@gmail.com'),
      password: await hashService.hash('Azerty@123'),
      firstName: 'john',
      lastName: 'doe',
      role: Roles.USER,
      isActive: false,
    });

    repository = new InMemoryUserRepository([johnDoe, AliceReynolds]);
    useCase = new LoginUseCase(repository, hashService, tokenService);
  });

  describe('Scenario: Happy Path', () => {
    const payload = {
      email: 'johndoe@gmail.com',
      password: 'Azerty@123',
    };

    it('should login successfully', async () => {
      const result = await useCase.execute(payload);

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 60 * 15,
        user: {
          id: 'id-1',
          firstName: 'john',
          lastName: 'doe',
          role: 'user',
        },
      });
    });

    it('should update last login date', async () => {
      await useCase.execute(payload);

      const user = repository.database[0];

      expect(Math.abs(user.lastLoginAt!.getTime() - Date.now())).toBeLessThan(
        1000,
      );
    });
  });

  describe('Scenario: User not found', () => {
    const payload = {
      email: 'johndo@gmail.com',
      password: 'Azerty@123',
    };

    it('should fail if user is not found', async () => {
      await expect(() => useCase.execute(payload)).rejects.toThrow(
        `User with this email ${payload.email} is not found`,
      );
    });
  });

  describe('Scenario: Invalid credentials', () => {
    const payload = {
      email: 'johndoe@gmail.com',
      password: 'wrongPassword',
    };

    it('should fail if password is incorrect', async () => {
      await expect(() => useCase.execute(payload)).rejects.toThrow(
        'Invalid credentials provided',
      );
    });
  });

  describe('Scenario: Account deactivated', () => {
    const payload = {
      email: 'ralice@gmail.com',
      password: 'Azerty@123',
    };

    it('should fail if user account is deactivated', async () => {
      await expect(() => useCase.execute(payload)).rejects.toThrow(
        'Account is deactivated',
      );
    });
  });
});
