export const I_AUTH_CONFIG_SERVICE = 'I_AUTH_CONFIG_SERVICE';

export interface AuthConfig {
  accessTokenExpiresIn: number; // en secondes
  refreshTokenExpiresIn: number; // en secondes
  tokenType: string;
  maxLoginAttempts: number;
  lockoutDuration: number; // en minutes
}

export interface IAuthConfigService {
  getAuthConfig(): AuthConfig;
}