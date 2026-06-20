const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const USERS = [
  {
    id: "cmqh5aqbt000011waqbp5qkik",
    name: "عبدالله الصقير",
    email: "admin@helpdesk.com",
    passwordHash: "$2b$12$lcMs5nb0SOhh5yA5atJ1aeepgo2VsE3zzCbPyjR.EwvpREU5woHe2",
    role: "ADMIN",
    department: "تقنية المعلومات",
  },
  {
    id: "cmqlkv4w90000lw9g4lzgfowj",
    name: "test user",
    email: "t@t.com",
    passwordHash: "$2b$10$sGf4LVmlcNkw.zUSRnBkMOQX7nzYYISyqr4qEwowK8jLjp8DefI42",
    role: "USER",
    department: "الخدمات المشتركة",
  },
  {
    id: "cmqlkvsiz0001lw9gr5hjeh8f",
    name: "test h",
    email: "th@t.com",
    passwordHash: "$2b$12$cclv3q/29Lc7Vp3R3sPpPeQ2cCcVWB5MrL6dG8N40GxspdHzMJre6",
    role: "SUPPORT",
    department: "الخدمات المشتركة",
  },
];

async function main() {
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash: user.passwordHash },
      create: user,
    });
    console.log(`✓ Synced: ${user.email}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
