// import { Module } from '@nestjs/common';
// import { Injectable } from '@nestjs/common';
// // import { AuthController } from './presentation/controllers/auth.controller';
// // import { LoginUseCase } from './application/use-cases/login.use-case';
// // import { ILoginUseCase } from './application/interfaces/login-use-case.interface';
// // import { NestAuthConfigService } from './infrastructure/services/nest-auth-config.service';
// // import { IAuthConfigService } from './domain/services/auth-config.service.interface';

// @Injectable()
// class InjectableLoginUseCase extends LoginUseCase {}

// @Module({
//   controllers: [AuthController],
//   providers: [
//     // {
//     //   provide: ILoginUseCase,
//     //   useClass: InjectableLoginUseCase,
//     // },
//     // {
//     //   provide: IAuthConfigService,
//     //   useClass: NestAuthConfigService,
//     // },
//     // TODO: Add missing providers when ready:
//     // - IUserRepository implementation
//     // - IPasswordService implementation  
//     // - ITokenService implementation
//   ],
//   exports: [
//     // ILoginUseCase,
//     // IAuthConfigService,
//     // Export services that other modules might need
//   ],
// })
// export class AuthModule {}