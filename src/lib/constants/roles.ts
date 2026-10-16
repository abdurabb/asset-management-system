export const USER_ROLES = ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"] as const;
export type UserOneRole =
  | "SUPER_ADMIN"
  | "MANAGER"
  | "ADMIN"
  | "USER";
export type UserRole = (typeof USER_ROLES)[number];

export const GLOBAL_ROLES: UserOneRole[] = ["SUPER_ADMIN", "MANAGER"];
export const OFFICE_ADMIN_ROLES: UserOneRole[] = ["SUPER_ADMIN", "MANAGER", "ADMIN"];
export const ASSET_WRITE_ROLES: UserOneRole[] = ["SUPER_ADMIN", "MANAGER", "ADMIN"];
export const ASSET_READ_ROLES: UserOneRole[] = ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"];

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    "OFFICE_CREATE",
    "OFFICE_READ",
    "OFFICE_UPDATE",
    "OFFICE_DELETE",
    "USER_CREATE",
    "USER_READ",
    "USER_UPDATE",
    "USER_DELETE",
    "ASSET_CREATE",
    "ASSET_READ",
    "ASSET_UPDATE",
    "ASSET_DELETE",
    "CATEGORY_MANAGE",
    "ASSIGNMENT_MANAGE",
    "MAINTENANCE_MANAGE",
    "DOCUMENT_MANAGE",
    "REPORT_READ",
    "AUDIT_READ",
  ],

  MANAGER: [
    "OFFICE_CREATE",
    "OFFICE_READ",
    "OFFICE_UPDATE",
    "OFFICE_DELETE",
    "USER_CREATE",
    "USER_READ",
    "USER_UPDATE",
    "USER_DELETE",
    "ASSET_CREATE",
    "ASSET_READ",
    "ASSET_UPDATE",
    "ASSET_DELETE",
    "CATEGORY_MANAGE",
    "ASSIGNMENT_MANAGE",
    "MAINTENANCE_MANAGE",
    "DOCUMENT_MANAGE",
    "REPORT_READ",
    "AUDIT_READ",
  ],

  ADMIN: [
    "OFFICE_READ",
    "USER_CREATE",
    "USER_READ",
    "USER_UPDATE",
    "ASSET_CREATE",
    "ASSET_READ",
    "ASSET_UPDATE",
    "CATEGORY_MANAGE",
    "ASSIGNMENT_MANAGE",
    "MAINTENANCE_MANAGE",
    "DOCUMENT_MANAGE",
    "REPORT_READ",
  ],

  USER: ["ASSET_READ", "ASSIGNMENT_READ", "DOCUMENT_READ"],
} as const;

export const ASSET_STATUSES = [
  "AVAILABLE",
  "ASSIGNED",
  "MAINTENANCE",
  "RETIRED",
] as const;

export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const MAINTENANCE_STATUSES = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const ROLE_LABELS: Record<UserOneRole, string> = {
  SUPER_ADMIN: "Global Admin",
  MANAGER: "Manager",
  ADMIN: "Office Admin",
  USER: "Employee",
};
