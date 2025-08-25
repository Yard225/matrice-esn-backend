export interface IPasswordService {
  /**
   * Hash a plain text password
   */
  hash(plainPassword: string): Promise<string>;

  /**
   * Verify a plain text password against a hash
   */
  verify(plainPassword: string, hashedPassword: string): Promise<boolean>;

  /**
   * Generate a random password
   */
  generateRandomPassword(length?: number): string;
}