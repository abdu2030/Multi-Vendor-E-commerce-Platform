const { PrismaClient, Role } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = scryptSync(password, salt, 64);

  return `scrypt$${salt}$${derivedKey.toString("base64url")}`;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const fullName = process.env.ADMIN_NAME ?? "Platform Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed the admin user.");
  }

  await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
    create: {
      fullName,
      email,
      passwordHash: hashPassword(password),
      role: Role.ADMIN
    }
  });

  console.log(`Admin user ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
