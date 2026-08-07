import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export class JwtUtils {
  /**
   * Gera um JWT token
   */
  static generate(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTokenExpiresIn as jwt.SignOptions['expiresIn'] });
  }

  /**
   * Verifica e descodifica um JWT token
   */
  static verify(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }
}