export interface TokenPayload {
  sub: string;
  // email: string;
  role: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export const I_TOKEN_STRATEGY = 'I_TOKEN_STRATEGY';

export interface ITokenStrategy {
  /**
   * 
   * @param payload - Données necéssaires à la génération de l'Access Token
   * @returns Promise<string> - retourne l'Access Token généré
   */
  generateAccessToken(
    payload: Omit<TokenPayload, 'iat' | 'exp'>,
  ): Promise<string>;

  /**
   * 
   * @param payload - Données necéssaires à la génération de l'Access Token
   * @returns Promise<string> - retourne le Refresh Token généré
   */
  generateRefreshToken(
    payload: Omit<TokenPayload, 'iat' | 'exp'>,
  ): Promise<string>;

  /**
   * 
   * @param token - Token précédemment généré
   * @returns Promise<TokenPayload> - Retourne les informations contenu dans le Token
   */
  verifyAccessToken(token: string): Promise<TokenPayload>;

  /**
   * 
   * @param token - Token précédemment généré
   * @returns Promise<TokenPayload> - Retourne les informations contenu dans le Refresh Token
   */
  verifyRefreshToken(token: string): Promise<TokenPayload>;

  /**
   * 
   * @param authHeader - Entête de l'authentification
   * @returns - Retourne string si le prefix est Bearer sinon null
   */
  extractTokenFromHeader(authHeader: string): string | null;
}