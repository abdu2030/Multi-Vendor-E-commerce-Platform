const { PrismaClient, Role } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();

const starterCategories = [
  {
    name: "Electronics",
    description: "Devices, accessories, and connected products.",
    children: ["Phones & Tablets", "Computers", "Audio", "Cameras"]
  },
  {
    name: "Fashion",
    description: "Clothing, shoes, bags, jewelry, and style essentials.",
    children: ["Women", "Men", "Shoes", "Accessories"]
  },
  {
    name: "Home & Living",
    description: "Furniture, decor, kitchen, bedding, and home improvement.",
    children: ["Furniture", "Kitchen", "Decor", "Bedding"]
  },
  {
    name: "Beauty & Personal Care",
    description: "Skincare, makeup, haircare, fragrance, and wellness basics.",
    children: ["Skincare", "Makeup", "Haircare", "Fragrance"]
  },
  {
    name: "Sports & Outdoors",
    description: "Fitness gear, outdoor equipment, and active lifestyle products.",
    children: ["Fitness", "Camping", "Cycling", "Team Sports"]
  },
  {
    name: "Books & Stationery",
    description: "Books, notebooks, art supplies, and office essentials.",
    children: ["Books", "Notebooks", "Art Supplies", "Office Supplies"]
  }
];

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

  await seedStarterCategories();
}

async function seedStarterCategories() {
  let seededCount = 0;

  for (const category of starterCategories) {
    const parent = await prisma.category.upsert({
      where: { slug: slugify(category.name) },
      update: {
        name: category.name,
        description: category.description,
        isActive: true
      },
      create: {
        name: category.name,
        slug: slugify(category.name),
        description: category.description,
        isActive: true
      }
    });

    seededCount += 1;

    for (const childName of category.children) {
      await prisma.category.upsert({
        where: { slug: slugify(childName) },
        update: {
          name: childName,
          parentId: parent.id,
          isActive: true
        },
        create: {
          name: childName,
          slug: slugify(childName),
          parentId: parent.id,
          isActive: true
        }
      });

      seededCount += 1;
    }
  }

  console.log(`Starter categories ready: ${seededCount}`);
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "category";
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
