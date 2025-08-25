import { Module } from '@nestjs/common';
import { AuthController } from './presentation/controllers/auth.controller';
import { LoginUseCase } from './application/use-cases/login.use-case';

@Module({
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    // TODO: Add other providers:
    // - IUserRepository implementation
    // - IPasswordService implementation  
    // - ITokenService implementation
  ],
  exports: [
    LoginUseCase,
    // Export services that other modules might need
  ],
})
export class AuthModule {}