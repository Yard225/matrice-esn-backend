export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface ITokenService {
  /**
   * Generate an access token
   */
  generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string>;

  /**
   * Generate a refresh token
   */
  generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string>;

  /**
   * Verify and decode an access token
   */
  verifyAccessToken(token: string): Promise<TokenPayload>;

  /**
   * Verify and decode a refresh token
   */
  verifyRefreshToken(token: string): Promise<TokenPayload>;

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null;
}