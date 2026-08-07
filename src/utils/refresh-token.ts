import crypto from 'crypto';
import { config } from '../config/env';

export class RefreshTokenUtils {
  /**
   * Gera um refresh token opaco (não é um JWT — só serve de chave
   * aleatória de alta entropia, guardamos é o hash na BD).
   */
  static generate(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  /**
   * Hash determinístico para procurar o token na BD sem guardar o
   * valor em texto simples (sha256 é suficiente aqui — o token já é
   * aleatório e de alta entropia, ao contrário de uma password).
   */
  static hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static expiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.refreshTokenExpiresInDays);
    return expiresAt;
  }
}
