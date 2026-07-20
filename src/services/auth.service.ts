import { prisma } from "../config/database";
import { PasswordUtils } from "../utils/password";
import { JwtUtils } from "../utils/jwt";
import { RegisterInput, CreateUserInput, LoginInput } from "../schemas/auth.schema";

export class AuthService {
  /**
   * Cria o utilizador na BD e devolve-o junto com um token JWT.
   */
  private async createUserWithRole(data: {
    name: string;
    email: string;
    password: string;
    role: "USER" | "PHOTOGRAPHER" | "ADMIN";
  }) {
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
        role: data.role,
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
   * Registo público — cria sempre um utilizador com role USER.
   */
  async register(data: RegisterInput) {
    return this.createUserWithRole({ ...data, role: "USER" });
  }

  /**
   * Criação de utilizador por um admin — permite escolher a role
   * (USER, PHOTOGRAPHER ou ADMIN). Rota protegida, ver auth.routes.ts.
   */
  async createUser(data: CreateUserInput) {
    return this.createUserWithRole(data);
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
            portfolioUrl: true,
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
