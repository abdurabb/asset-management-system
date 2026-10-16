import { prisma } from "@/lib/backend/prisma";

export async function writeAuditLog(input: {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string | null;
  details?: Record<string, unknown> | string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId ?? null,
        details:
          typeof input.details === "string"
            ? input.details
            : input.details
              ? JSON.stringify(input.details)
              : null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

export async function getDefaultCompanyId() {
  const company = await prisma.company.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!company) {
    const created = await prisma.company.create({
      data: {
        name: "Future Vision",
        code: "FV",
        description: "Default company",
      },
    });
    return created.id;
  }

  return company.id;
}
