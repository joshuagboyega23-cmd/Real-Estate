import "dotenv/config";
import dns from "node:dns";
import bcrypt from "bcryptjs";
import { PrismaClient, Role, LeaseStatus, UnitStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Ensure IPv4 lookup precedence on Node.js / Windows platforms
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

// Refuse to run when NODE_ENV is production
if (process.env.NODE_ENV === "production") {
  console.error("Seeding aborted: Cannot run seed script in production environment (NODE_ENV=production).");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Seeding aborted: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const seedPassword = process.env.SEED_PASSWORD || "DevSeedFallbackPass123!";
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  // 1. Identify or create Owner (use existing OWNER if present)
  let owner = await prisma.user.findFirst({
    where: { roles: { has: Role.OWNER } },
  });

  if (!owner) {
    owner = await prisma.user.upsert({
      where: { email: "owner@example.com" },
      update: {},
      create: {
        name: "Demo Owner",
        email: "owner@example.com",
        roles: [Role.OWNER],
        lastActiveRole: Role.OWNER,
        passwordHash,
        isActive: true,
      },
    });
  }

  // 2. Upsert Caretaker
  const caretaker = await prisma.user.upsert({
    where: { email: "caretaker@example.com" },
    update: {},
    create: {
      name: "Demo Caretaker",
      email: "caretaker@example.com",
      roles: [Role.CARETAKER],
      lastActiveRole: Role.CARETAKER,
      passwordHash,
      isActive: true,
    },
  });

  // 3. Upsert Tenant
  const tenant = await prisma.user.upsert({
    where: { email: "tenant@example.com" },
    update: {},
    create: {
      name: "Demo Tenant",
      email: "tenant@example.com",
      roles: [Role.TENANT],
      lastActiveRole: Role.TENANT,
      passwordHash,
      isActive: true,
    },
  });

  // 4. Upsert Property: "Sample Residence"
  const property = await prisma.property.upsert({
    where: { slug: "sample-residence" },
    update: {
      ownerId: owner.id,
    },
    create: {
      ownerId: owner.id,
      name: "Sample Residence",
      slug: "sample-residence",
      description: "A well-appointed demo residential property for development and staging.",
      address: "123 Sample Boulevard, Victoria Island",
      city: "Lagos",
      state: "Lagos State",
      country: "Nigeria",
      currency: "NGN",
      amenities: ["24/7 Security", "Backup Generator", "Borehole Water"],
      images: [],
      isPublished: false,
    },
  });

  // 5. Create or find Units A1 and A2 (rent in minor units, e.g., 250,000 NGN = 25,000,000 kobo)
  let unitA1 = await prisma.unit.findFirst({
    where: { propertyId: property.id, name: "A1" },
  });
  if (!unitA1) {
    unitA1 = await prisma.unit.create({
      data: {
        propertyId: property.id,
        name: "A1",
        description: "Spacious 2-bedroom apartment with balcony",
        bedrooms: 2,
        bathrooms: 2,
        rentAmount: 25000000, // 250,000.00 NGN in minor units
        status: UnitStatus.OCCUPIED,
        features: ["Air Conditioning", "Fitted Kitchen", "Balcony"],
        images: [],
      },
    });
  }

  let unitA2 = await prisma.unit.findFirst({
    where: { propertyId: property.id, name: "A2" },
  });
  if (!unitA2) {
    unitA2 = await prisma.unit.create({
      data: {
        propertyId: property.id,
        name: "A2",
        description: "Modern 1-bedroom apartment",
        bedrooms: 1,
        bathrooms: 1,
        rentAmount: 18000000, // 180,000.00 NGN in minor units
        status: UnitStatus.VACANT,
        features: ["Fitted Kitchen", "Built-in Wardrobes"],
        images: [],
      },
    });
  }

  // 6. Create or link PropertyCaretaker
  await prisma.propertyCaretaker.upsert({
    where: {
      propertyId_userId: {
        propertyId: property.id,
        userId: caretaker.id,
      },
    },
    update: {},
    create: {
      propertyId: property.id,
      userId: caretaker.id,
    },
  });

  // 7. Create or find ACTIVE Lease for Tenant on Unit A1
  let activeLease = await prisma.lease.findFirst({
    where: {
      unitId: unitA1.id,
      tenantId: tenant.id,
      status: LeaseStatus.ACTIVE,
    },
  });

  if (!activeLease) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    activeLease = await prisma.lease.create({
      data: {
        unitId: unitA1.id,
        tenantId: tenant.id,
        startDate,
        endDate,
        rentAmount: unitA1.rentAmount,
        currency: "NGN",
        depositAmount: 5000000, // 50,000.00 NGN in minor units
        dueDay: 1,
        status: LeaseStatus.ACTIVE,
      },
    });
  }

  // 8. Log activity entry for SEED_RUN
  await prisma.activityLog.create({
    data: {
      actorId: owner.id,
      action: "SEED_RUN",
      entityType: "System",
      entityId: "seed",
      metadata: {
        propertyId: property.id,
        propertySlug: property.slug,
        caretakerId: caretaker.id,
        tenantId: tenant.id,
        unitA1Id: unitA1.id,
        unitA2Id: unitA2.id,
        leaseId: activeLease.id,
        seededAt: new Date().toISOString(),
      },
    },
  });

  // Print seeded emails only (never passwords)
  console.log("Database seeded successfully:");
  console.log(`- Owner: ${owner.email}`);
  console.log(`- Caretaker: ${caretaker.email}`);
  console.log(`- Tenant: ${tenant.email}`);
}

main()
  .catch(async (error) => {
    console.error("Seeding execution failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

