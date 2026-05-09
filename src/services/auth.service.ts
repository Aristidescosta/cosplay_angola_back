import { prisma } from '../config/database';
import { PasswordUtils } from '../utils/password';
import { JwtUtils } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

export class AuthService {
  /**
   * Registar novo utilizador
   */
  async register(data: RegisterInput) {
    // 1. Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    // 2. Hash da password
    const hashedPassword = await PasswordUtils.hash(data.password);

    // 3. Criar utilizador na base de dados
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // 4. Gerar JWT token
    const token = JwtUtils.generate({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      token,
    };
  }

  /**
   * Login de utilizador
   */
  async login(data: LoginInput) {
    // 1. Verificar se utilizador existe
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // 2. Verificar password
    const isPasswordValid = await PasswordUtils.compare(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    // 3. Gerar JWT token
    const token = JwtUtils.generate({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 4. Retornar user (sem password!) e token
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Obter utilizador pelo ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        photographer: true,
      },
    });

    if (!user) {
      throw new Error('Utilizador não encontrado');
    }

    return user;
  }
}