import { prisma } from "./prisma";

export async function getSetting(key: string, defaultValue = ""): Promise<string> {
  try {
    const s = await prisma.systemSetting.findUnique({ where: { key } });
    return s?.value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.systemSetting.upsert({
    where:  { key },
    update: { value },
    create: { key, value },
  });
}
