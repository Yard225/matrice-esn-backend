import { User } from '../entities/User.entity';
import { Email } from '../value-objects/Email.vo';

export interface UserRepositoryInterface {
  /**
   * Trouve un utilisateur par son email
   * @param email - Email de l'utilisateur (Value Object)
   * @returns Promise<User | null> - L'utilisateur trouvé ou null
   */
  findByEmail(email: Email): Promise<User | null>;

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
   * @returns Promise<User> - L'utilisateur sauvegardé avec son ID
   */
  save(user: User): Promise<User>;

  /**
   * Vérifie si un email existe déjà en base
   * @param email - Email à vérifier (Value Object)
   * @returns Promise<boolean> - true si l'email existe, false sinon
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Supprime un utilisateur par son ID
   * @param id - Identifiant de l'utilisateur à supprimer
   * @returns Promise<boolean> - true si supprimé, false sinon
   */
  deleteById(id: string): Promise<boolean>;

  /**
   * Met à jour le mot de passe d'un utilisateur
   * @param id - Identifiant de l'utilisateur
   * @param hashedPassword - Nouveau mot de passe haché
   * @returns Promise<boolean> - true si mis à jour, false sinon
   */
  updatePassword(id: string, hashedPassword: string): Promise<boolean>;

  /**
   * Met à jour la date de dernière connexion
   * @param id - Identifiant de l'utilisateur
   * @param lastLoginAt - Date de dernière connexion
   * @returns Promise<boolean> - true si mis à jour, false sinon
   */
  updateLastLogin(id: string, lastLoginAt: Date): Promise<boolean>;

  /**
   * Active ou désactive un compte utilisateur
   * @param id - Identifiant de l'utilisateur
   * @param isActive - Statut d'activation
   * @returns Promise<boolean> - true si mis à jour, false sinon
   */
  updateActiveStatus(id: string, isActive: boolean): Promise<boolean>;

  /**
   * Compte le nombre total d'utilisateurs actifs
   * @returns Promise<number> - Nombre d'utilisateurs actifs
   */
  countActiveUsers(): Promise<number>;
}

/**
 * NOTES IMPORTANTES POUR L'IMPLÉMENTATION :
 *
 * 1. COUCHE DOMAIN : Cette interface appartient à la couche Domain
 *    et ne doit jamais importer quoi que ce soit des couches externes.
 *
 * 2. VALUE OBJECTS : Utilisez les Value Objects (comme Email)
 *    plutôt que des types primitifs pour une meilleure sécurité.
 *
 * 3. ENTITÉS DOMAIN : Travaillez avec des entités Domain (User),
 *    pas avec des entités de base de données (UserSchema).
 *
 * 4. RESPONSABILITÉ UNIQUE : Chaque méthode a une responsabilité claire.
 *
 * 5. NOMMAGE : Utilisez des noms explicites qui reflètent l'intention métier.
 *
 * 6. GESTION D'ERREURS : Les exceptions métier seront gérées
 *    dans les Use Cases, pas dans le repository.
 *
 * 7. TYPES DE RETOUR : Utilisez Promise pour toutes les opérations asynchrones.
 *
 * 8. NULL VS UNDEFINED : Utilisez null pour indiquer l'absence de résultat.
 */

/**
 * EXEMPLE D'UTILISATION DANS UN USE CASE :
 *
 * export class LoginUserUseCase {
 *   constructor(
 *     private readonly userRepository: UserRepositoryInterface,
 *     private readonly hashingService: HashingServiceInterface,
 *     private readonly tokenService: TokenServiceInterface
 *   ) {}
 *
 *   async execute(request: LoginRequestDto): Promise<LoginResponseDto> {
 *     const email = new Email(request.email);
 *     const user = await this.userRepository.findByEmail(email);
 *
 *     if (!user) {
 *       throw new UserNotFoundException();
 *     }
 *
 *     // ... reste de la logique
 *   }
 * }
 */
