import { User } from '../entities/User.entity';
import { Email } from '../value-objects/Email.vo';

export const I_USER_REPOSITORY = 'I_USER_REPOSITORY';

export interface IUserRepository {
  /**
   * Trouve un utilisateur par son email
   * @param email - Email de l'utilisateur
   * @returns Promise<User | null> - L'utilisateur trouvé ou null
   */
  findByEmail(email: string): Promise<User | null>;

  findByIndex(id: string): number;

  /**
   * Trouve un utilisateur par son ID
   * @param id - Identifiant unique de l'utilisateur
   * @returns Promise<User | null> - L'utilisateur trouvé ou null
   */
  findById(id: string): Promise<User | null>;

  /**
   * @returns Promise<User[]> - Liste de tous les utilisateurs
   */
  findAll(): Promise<User[]>;

  /**
   * Sauvegarde un utilisateur (création ou mise à jour)
   * @param user - Entité utilisateur à sauvegarder
   * @returns Promise<void> - retourne rien
   */
  save(user: User): Promise<void>;

  /**
   * 
   * @param user - Entité utilisateur à créer
   */
  create(user: User): Promise<void>;

  /**
   * Vérifie si un email existe déjà en base
   * @param email - Email à vérifier (Value Object)
   * @returns Promise<boolean> - true si l'email existe, false sinon
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Supprime un utilisateur par son ID
   * @param id - Identifiant de l'utilisateur à supprimer
   * @returns Promise<void> - ne retourne rien
   */
  deleteById(id: string): Promise<void>;

  /**
   * Met à jour le mot de passe d'un utilisateur
   * @param id - Identifiant de l'utilisateur
   * @param hashedPassword - Nouveau mot de passe haché
   * @returns Promise<boolean> - ne retourne rien
   */
  updatePassword(id: string, hashedPassword: string): Promise<void>;

  /**
   * Met à jour la date de dernière connexion
   * @param id - Identifiant de l'utilisateur
   * @param lastLoginAt - Date de dernière connexion
   * @returns Promise<boolean> - ne retourne rien
   */
  updateLastLogin(id: string, lastLoginAt: Date): Promise<void>;

  /**
   * Active ou désactive un compte utilisateur
   * @param id - Identifiant de l'utilisateur
   * @param isActive - Statut d'activation
   * @returns Promise<boolean> - ne retourne rien
   */
  updateActiveStatus(id: string, isActive: boolean): Promise<void>;

  /**
   * Compte le nombre total d'utilisateurs actifs
   * @returns Promise<number> - Nombre d'utilisateurs actifs
   */
  countActiveUsers(): Promise<number>;
}
