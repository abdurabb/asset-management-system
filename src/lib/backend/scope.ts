import { UserOneRole, GLOBAL_ROLES } from "@/lib/constants/roles";
import { User } from "@/types/user";

export function isGlobalRole(role: UserOneRole) {
  return GLOBAL_ROLES.includes(role);
}

/** Office IDs the current user can access. Null = all offices. */
export function getScopedOfficeId(auth: User): string | null {
  if (isGlobalRole(auth.role)) {
    return null;
  }

  return auth.user.officeId;
}

export function assertOfficeAccess(
  auth: User,
  officeId: string,
): { ok: true } | { ok: false; message: string } {
  const scoped = getScopedOfficeId(auth);

  if (scoped === null) {
    return { ok: true };
  }

  if (!scoped) {
    return {
      ok: false,
      message: "Your account is not assigned to an office",
    };
  }

  if (scoped !== officeId) {
    return {
      ok: false,
      message: "Forbidden: you can only access your office data",
    };
  }

  return { ok: true };
}

export function officeWhereFilter(auth: User): { officeId?: string } {
  const scoped = getScopedOfficeId(auth);

  if (scoped === null) {
    return {};
  }

  return { officeId: scoped };
}

export function canManageRole(
  actorRole: UserOneRole,
  targetRole: UserOneRole,
): boolean {
  if (actorRole === "SUPER_ADMIN") return true;

  if (actorRole === "MANAGER") {
    return targetRole !== "SUPER_ADMIN";
  }

  if (actorRole === "ADMIN") {
    return targetRole === "ADMIN" || targetRole === "USER";
  }

  return false;
}
