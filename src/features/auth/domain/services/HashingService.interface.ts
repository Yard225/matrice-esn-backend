export const I_PASSWORD_SERVICE = 'I_PASSWORD_SERVICE';

export interface IPasswordService {
  /**
   *
   * @param plainPassword - Mot de passe en claire
   * @returns Promise<string> - Mot de passe hashé
   */
  hash(plainPassword: string): Promise<string>;

  /**
   *
   * @param plainPassword - Mot de passe en claire
   * @param hashedPassword - Mot de passe hashé
   * @returns Promise<boolean> - retourne true si les mots de passe correspondent ou non s'ils ne correspondent pas
   */
  verify(plainPassword: string, hashedPassword: string): Promise<boolean>;

  /**
   * 
   * @param length - Longueur souhaité du mot de passe qui sera généré
   * @returns string - retourne le mot de passe généré 
   */
  generateRandomPassword(length?: number): string;
}
