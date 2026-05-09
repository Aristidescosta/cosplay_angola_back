import { prisma } from "../config/database";
import { PasswordUtils } from "../utils/password";
import { JwtUtils } from "../utils/jwt";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";

export class AuthService {
  /**
   * Registar novo utilizador
   */
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("Email já está em uso");
    }
    const hashedPassword = await PasswordUtils.hash(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

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
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Credenciais inválidas");
    }

    const isPasswordValid = await PasswordUtils.compare(
      data.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new Error("Credenciais inválidas");
    }

    const token = JwtUtils.generate({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

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
        photographer: {
          select: {
            id: true,
            bio: true,
            website: true,
            instagram: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("Utilizador não encontrado");
    }

    return user;
  }
}
