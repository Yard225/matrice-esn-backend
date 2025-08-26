// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import {
//   AuthConfig,
//   IAuthConfigService,
// } from '../../domain/services/auth-config.service.interface';

// @Injectable()
// export class NestAuthConfigService implements IAuthConfigService {
//   constructor(private readonly configService: ConfigService) {}

//   getAuthConfig(): AuthConfig {
//     return {
//       accessTokenExpiresIn: this.configService.get<number>(
//         'JWT_EXPIRATION_SECONDS',
//         60 * 15,
//       ), // 15 minutes default
//       refreshTokenExpiresIn: this.configService.get<number>(
//         'JWT_REFRESH_EXPIRATION_SECONDS',
//         24 * 60 * 60 * 7,
//       ), // 7 days default
//       tokenType: this.configService.get<string>('JWT_TOKEN_TYPE', 'Bearer'),
//       maxLoginAttempts: this.configService.get<number>('MAX_LOGIN_ATTEMPTS', 5),
//       lockoutDuration: this.configService.get<number>(
//         'LOCKOUT_DURATION_MINUTES',
//         15,
//       ),
//     };
//   }
// }

// /*
// Variables d'environnement à ajouter :
// JWT_EXPIRATION_SECONDS=900
// JWT_REFRESH_EXPIRATION_SECONDS=604800
// JWT_TOKEN_TYPE=Bearer
// MAX_LOGIN_ATTEMPTS=5
// LOCKOUT_DURATION_MINUTES=15
// */
