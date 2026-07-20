import 'dotenv/config';
import { prisma } from '../src/config/database';
import { PasswordUtils } from '../src/utils/password';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    throw new Error(
      'Define ADMIN_EMAIL e ADMIN_PASSWORD nas variáveis de ambiente antes de correr o seed.'
    );
  }

  const hashedPassword = await PasswordUtils.hash(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`Admin pronto: ${admin.email} (role: ${admin.role})`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
