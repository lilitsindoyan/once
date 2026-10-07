/**
 * npm run db:seed
 *  - creates the first admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (if missing)
 *  - with --demo: also a demo series of 20 bottles and prints 3 serial + code pairs to try
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { decrypt, encrypt, generateHiddenCode, generateSerial } from "../src/lib/crypto";

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ characters) in .env");
  }
  const existing = await db.adminUser.findUnique({ where: { email } });
  if (!existing) {
    await db.adminUser.create({
      data: { email, name: "ONCE Admin", passwordHash: await bcrypt.hash(password, 12), role: "SUPER_ADMIN" },
    });
    console.log(`Admin created: ${email}`);
  } else {
    console.log(`Admin exists: ${email}`);
  }

  if (process.argv.includes("--demo")) {
    const series = await db.series.create({
      data: {
        name: "Series I · 40 years",
        batchNumber: "DEMO-001",
        quantity: 20,
        productionDate: new Date("2026-08-01"),
        passportTemplate: [
          { key: "origin", label: { en: "Origin", hy: "Ծագում", ru: "Происхождение" }, type: "text" },
          { key: "age", label: { en: "Age", hy: "Տարիք", ru: "Выдержка" }, type: "text" },
          { key: "tasting_notes", label: { en: "Tasting notes", hy: "Համային նոտաներ", ru: "Дегустационные заметки" }, type: "longtext" },
        ],
        passportDefaults: { origin: "Armenia", age: "40 years", tasting_notes: "Dried apricot, oak, dark chocolate." },
      },
    });
    const serials = new Set<string>();
    while (serials.size < 20) serials.add(generateSerial());
    await db.bottle.createMany({
      data: [...serials].map((serial) => ({ serial, hiddenCodeEnc: encrypt(generateHiddenCode()), seriesId: series.id })),
    });
    const sample = await db.bottle.findMany({ where: { seriesId: series.id }, take: 3 });
    console.log("Demo bottles (serial / hidden code):");
    for (const b of sample) console.log(`  ${b.serial}  /  ${decrypt(b.hiddenCodeEnc)}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
