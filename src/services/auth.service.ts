import crypto from "crypto";
import { prisma } from "../config/database";
import { PasswordUtils } from "../utils/password";
import { JwtUtils } from "../utils/jwt";
import { RefreshTokenUtils } from "../utils/refresh-token";
import { RegisterInput, CreateUserInput, LoginInput, RefreshTokenInput } from "../schemas/auth.schema";

export class AuthService {
  /**
   * Gera um par access token (JWT curto) + refresh token (opaco,
   * guardado com hash na BD para poder ser revogado).
   */
  private async issueTokens(user: { id: string; email: string; role: string }) {
    const accessToken = JwtUtils.generate({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = RefreshTokenUtils.generate();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: RefreshTokenUtils.hash(refreshToken),
        expiresAt: RefreshTokenUtils.expiresAt(),
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Cria o utilizador na BD e devolve-o junto com os tokens de sessão.
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

    const tokens = await this.issueTokens(user);

    return {
      user,
      ...tokens,
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

    const tokens = await this.issueTokens(user);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Troca um refresh token válido por um novo par de tokens.
   * O refresh token usado é revogado (rotação) — só pode ser usado uma vez.
   */
  async refresh(data: RefreshTokenInput) {
    const tokenHash = RefreshTokenUtils.hash(data.refreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new Error("Sessão expirada, é necessário fazer login novamente");
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user);
  }

  /**
   * Revoga um refresh token (logout). Idempotente — nunca lança erro,
   * mesmo que o token já não exista/esteja revogado.
   */
  async logout(refreshToken: string) {
    const tokenHash = RefreshTokenUtils.hash(refreshToken);

    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoga todas as sessões ativas de um utilizador
   * (ex: "terminar sessão em todos os dispositivos", troca de password).
   */
  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Lista utilizadores que podem ser donos de galerias (fotógrafos e
   * admins) — usado no seletor de fotógrafo ao criar/editar uma galeria.
   */
  async listPhotographers() {
    return prisma.user.findMany({
      where: { role: { in: ["PHOTOGRAPHER", "ADMIN"] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Cria um "fotógrafo de sombra": um utilizador com role PHOTOGRAPHER
   * sem que ele próprio se tenha registado — permite ao admin atribuir
   * galerias a fotógrafos que ainda não têm (ou não precisam já de)
   * login próprio. Email e password são gerados automaticamente e
   * nunca são usados/mostrados; quando o login de fotógrafos for
   * activado, um admin pode repor a password deste utilizador.
   */
  async quickCreatePhotographer(name: string) {
    const withoutDiacritics = Array.from(name.toLowerCase().normalize("NFD"))
      .filter((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        return !(code >= 0x0300 && code <= 0x036f); // marcas de acentuação
      })
      .join("");
    const slugBase =
      withoutDiacritics
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "fotografo";

    const email = `${slugBase}-${crypto.randomBytes(4).toString("hex")}@fotografos.cosplayangola.ao`;
    const password = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await PasswordUtils.hash(password);

    return prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "PHOTOGRAPHER",
      },
      select: { id: true, name: true, email: true, role: true },
    });
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
