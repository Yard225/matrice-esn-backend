import { JwtService } from '@nestjs/jwt';
import {
  ITokenStrategy,
  TokenPayload,
} from '../../domain/services/TokenService.interface';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy implements ITokenStrategy {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(
    payload: Omit<TokenPayload, 'iat' | 'exp'>,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.secret'),
    });
  }

  async generateRefreshToken(
    payload: Omit<TokenPayload, 'iat' | 'exp'>,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
    });
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('jwt.secret'),
    });
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
    });
  }

  extractTokenFromHeader(authHeader: string): string | null {
    throw new Error('Method not implemented.');
  }
}
