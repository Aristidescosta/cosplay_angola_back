import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export class PasswordUtils {
  /**
   * Hash de uma password
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compara password em texto plano com hash
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}