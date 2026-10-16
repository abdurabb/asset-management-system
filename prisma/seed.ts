import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const company =
    (await prisma.company.findFirst({ where: { code: "FV" } })) ||
    (await prisma.company.create({
      data: {
        name: "Future Vision",
        code: "FV",
        description: "Default company",
        address: "Abu Dhabi, UAE",
        phone: "+971 2 000 0000",
      },
    }));

  const abuDhabi =
    (await prisma.office.findFirst({ where: { code: "AUH" } })) ||
    (await prisma.office.create({
      data: {
        name: "Abu Dhabi Office",
        code: "AUH",
        city: "Abu Dhabi",
        country: "United Arab Emirates",
        address: "Al Maryah Island",
        phone: "+971 2 111 1111",
        companyId: company.id,
      },
    }));

  const dubai =
    (await prisma.office.findFirst({ where: { code: "DXB" } })) ||
    (await prisma.office.create({
      data: {
        name: "Dubai Office",
        code: "DXB",
        city: "Dubai",
        country: "United Arab Emirates",
        address: "Business Bay",
        phone: "+971 4 222 2222",
        companyId: company.id,
      },
    }));

  const password = await bcrypt.hash("Password123!", 10);

  const users = [
    {
      email: "admin@futurevision.com",
      name: "Global Admin",
      role: "SUPER_ADMIN",
      officeId: null as string | null,
    },
    {
      email: "manager@futurevision.com",
      name: "Company Manager",
      role: "MANAGER",
      officeId: null,
    },
    {
      email: "office.admin@futurevision.com",
      name: "Abu Dhabi Office Admin",
      role: "ADMIN",
      officeId: abuDhabi.id,
    },
    {
      email: "employee@futurevision.com",
      name: "Sara Ahmed",
      role: "USER",
      officeId: abuDhabi.id,
    },
    {
      email: "dubai.admin@futurevision.com",
      name: "Dubai Office Admin",
      role: "ADMIN",
      officeId: dubai.id,
    },
    {
      email: "dubai.employee@futurevision.com",
      name: "Omar Hassan",
      role: "USER",
      officeId: dubai.id,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        officeId: user.officeId,
        password,
        isActive: true,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        officeId: user.officeId,
        password,
      },
    });
  }

  const categories = [
    { name: "Laptops", description: "Company laptops and notebooks" },
    { name: "Monitors", description: "Displays and docking screens" },
    { name: "Phones", description: "Mobile phones and handsets" },
    { name: "Furniture", description: "Desks, chairs, and office furniture" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        companyId_name: {
          companyId: company.id,
          name: category.name,
        },
      },
      update: { isActive: true, description: category.description },
      create: {
        name: category.name,
        companyId: company.id,
        description: category.description,
      },
    });
  }

  const categoryMap = Object.fromEntries(
    (await prisma.category.findMany({ where: { companyId: company.id } })).map(
      (category) => [category.name, category],
    ),
  );

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@futurevision.com" },
  });
  const auhEmployee = await prisma.user.findUniqueOrThrow({
    where: { email: "employee@futurevision.com" },
  });
  const dxbEmployee = await prisma.user.findUniqueOrThrow({
    where: { email: "dubai.employee@futurevision.com" },
  });

  const assets = [
    {
      assetTag: "AUH-LAP001",
      name: "MacBook Pro 14",
      serialNumber: "FV-MBP-001",
      status: "AVAILABLE",
      location: "AUH IT Store",
      officeId: abuDhabi.id,
      categoryId: categoryMap.Laptops?.id,
      purchaseCost: 7200,
      description: "Engineering laptop",
    },
    {
      assetTag: "AUH-MON001",
      name: "Dell UltraSharp 27",
      serialNumber: "FV-MON-001",
      status: "ASSIGNED",
      location: "AUH Desk 12",
      officeId: abuDhabi.id,
      categoryId: categoryMap.Monitors?.id,
      purchaseCost: 1800,
      description: "Primary monitor",
    },
    {
      assetTag: "AUH-PHN001",
      name: "iPhone 15",
      serialNumber: "FV-PHN-001",
      status: "MAINTENANCE",
      location: "AUH Repair bench",
      officeId: abuDhabi.id,
      categoryId: categoryMap.Phones?.id,
      purchaseCost: 3500,
      description: "Screen replacement in progress",
    },
    {
      assetTag: "AUH-FUR001",
      name: "Herman Miller Chair",
      serialNumber: "FV-CHR-001",
      status: "AVAILABLE",
      location: "AUH Meeting Room A",
      officeId: abuDhabi.id,
      categoryId: categoryMap.Furniture?.id,
      purchaseCost: 4200,
      description: "Ergonomic chair",
    },
    {
      assetTag: "DXB-LAP001",
      name: "ThinkPad X1 Carbon",
      serialNumber: "FV-X1-001",
      status: "AVAILABLE",
      location: "DXB IT Store",
      officeId: dubai.id,
      categoryId: categoryMap.Laptops?.id,
      purchaseCost: 6100,
      description: "Sales laptop",
    },
    {
      assetTag: "DXB-PHN001",
      name: "Samsung Galaxy S24",
      serialNumber: "FV-S24-001",
      status: "ASSIGNED",
      location: "DXB Field kit",
      officeId: dubai.id,
      categoryId: categoryMap.Phones?.id,
      purchaseCost: 2800,
      description: "Field phone",
    },
  ];

  const createdAssets = [];
  for (const asset of assets) {
    const saved = await prisma.asset.upsert({
      where: { assetTag: asset.assetTag },
      update: {
        name: asset.name,
        serialNumber: asset.serialNumber,
        status: asset.status,
        location: asset.location,
        officeId: asset.officeId,
        categoryId: asset.categoryId ?? null,
        purchaseCost: asset.purchaseCost,
        description: asset.description,
        isActive: true,
      },
      create: asset,
    });
    createdAssets.push(saved);
  }

  const assetByTag = Object.fromEntries(
    createdAssets.map((asset) => [asset.assetTag, asset]),
  );

  const monitor = assetByTag["AUH-MON001"];
  const phone = assetByTag["AUH-PHN001"];
  const dxbPhone = assetByTag["DXB-PHN001"];

  if (monitor) {
    const existing = await prisma.assignment.findFirst({
      where: { assetId: monitor.id, isActive: true },
    });
    if (!existing) {
      await prisma.assignment.create({
        data: {
          assetId: monitor.id,
          userId: auhEmployee.id,
          assignedById: admin.id,
          officeId: abuDhabi.id,
          notes: "Assigned for daily workstation use",
        },
      });
    }
  }

  if (dxbPhone) {
    const existing = await prisma.assignment.findFirst({
      where: { assetId: dxbPhone.id, isActive: true },
    });
    if (!existing) {
      await prisma.assignment.create({
        data: {
          assetId: dxbPhone.id,
          userId: dxbEmployee.id,
          assignedById: admin.id,
          officeId: dubai.id,
          notes: "Field operations handset",
        },
      });
    }
  }

  if (phone) {
    const existing = await prisma.maintenanceRecord.findFirst({
      where: { assetId: phone.id },
      orderBy: { createdAt: "desc" },
    });
    if (!existing) {
      await prisma.maintenanceRecord.create({
        data: {
          assetId: phone.id,
          officeId: abuDhabi.id,
          title: "Screen replacement",
          description: "Cracked display reported by office admin",
          status: "IN_PROGRESS",
          performedBy: "AUH IT",
          createdById: admin.id,
        },
      });
    } else {
      await prisma.maintenanceRecord.update({
        where: { id: existing.id },
        data: {
          status: "IN_PROGRESS",
          completedAt: null,
          title: "Screen replacement",
        },
      });
    }
  }

  const documents = [
    {
      title: "IT Acceptable Use Policy",
      description: "Company-wide device usage policy",
      fileUrl: "https://example.com/policies/it-aup.pdf",
      fileType: "pdf",
      companyId: company.id,
      officeId: null as string | null,
      assetId: null as string | null,
    },
    {
      title: "MacBook Pro Invoice",
      description: "Purchase invoice for AUH-LAP001",
      fileUrl: "https://example.com/invoices/auh-lap001.pdf",
      fileType: "pdf",
      companyId: company.id,
      officeId: abuDhabi.id,
      assetId: assetByTag["AUH-LAP001"]?.id ?? null,
    },
  ];

  for (const document of documents) {
    const existing = await prisma.document.findFirst({
      where: { title: document.title, uploadedById: admin.id },
    });
    if (!existing) {
      await prisma.document.create({
        data: {
          ...document,
          uploadedById: admin.id,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Login accounts (password: Password123!):");
  users.forEach((user) => console.log(`- ${user.email} (${user.role})`));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
