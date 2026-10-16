import "server-only";

import {
  QueryClient,
  dehydrate,
  type DehydratedState,
} from "@tanstack/react-query";
import { NextRequest } from "next/server";

import { getAssetsController } from "@/lib/backend/controller/assetController";
import { getAssignmentsController } from "@/lib/backend/controller/assignmentController";
import { getCategoriesController } from "@/lib/backend/controller/categoryController";
import { getMaintenanceController } from "@/lib/backend/controller/maintenanceController";
import {
  getAuditLogsController,
  getCompanyController,
  getDashboardController,
  getDocumentsController,
  getReportsController,
} from "@/lib/backend/controller/miscController";
import { getOfficesController } from "@/lib/backend/controller/officeController";
import { getUsersController } from "@/lib/backend/controller/userController";
import { LIST_PAGE_SIZE } from "@/lib/pagination";
import type { User } from "@/types/user";

import { getServerAuth } from "./auth";
import {
  readActive,
  readPage,
  readParam,
  type AppSearchParams,
} from "./searchParams";

type Handler = (
  req: NextRequest,
  context?: unknown,
  data?: unknown,
  auth?: User,
) => Promise<Response>;

type QueryValue = string | number | boolean | undefined;

type ControllerResult<T> = {
  success?: boolean;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

async function readController<T>(
  handler: Handler,
  path: string,
  auth: User,
  query: Record<string, QueryValue> = {},
) {
  const url = new URL(path, "http://assetflow.internal");
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await handler(new NextRequest(url), undefined, undefined, auth);
  if (!response.ok) return null;

  const json = (await response.json()) as ControllerResult<T>;
  if (!json.success) return null;
  return json;
}

function setList(
  queryClient: QueryClient,
  key: string,
  params: Record<string, QueryValue>,
  result: ControllerResult<unknown> | null,
) {
  if (!result) return;
  const items = Array.isArray(result.data) ? result.data : [];
  queryClient.setQueryData([key, "list", params], {
    items,
    pagination: result.pagination ?? {
      page: Number(params.page) || 1,
      limit: Number(params.limit) || LIST_PAGE_SIZE,
      total: items.length,
      totalPages: items.length ? 1 : 0,
    },
  });
}

async function prepare(
  fill: (queryClient: QueryClient, auth: User) => Promise<void>,
): Promise<DehydratedState> {
  const queryClient = new QueryClient();
  const auth = await getServerAuth();
  if (auth) await fill(queryClient, auth);
  return dehydrate(queryClient);
}

function listParams(
  params: AppSearchParams,
  extra: Record<string, QueryValue>,
) {
  return {
    ...extra,
    page: readPage(params),
    limit: LIST_PAGE_SIZE,
  };
}

export function prefetchDashboard() {
  return prepare(async (queryClient, auth) => {
    const result = await readController(
      getDashboardController,
      "/api/dashboard",
      auth,
    );
    if (result) queryClient.setQueryData(["dashboard"], result.data);
  });
}

export function prefetchAssets(params: AppSearchParams) {
  return prepare(async (queryClient, auth) => {
    const list = listParams(params, {
      search: readParam(params, "search"),
      status: readParam(params, "status"),
      officeId: readParam(params, "office"),
    });

    const [assets, offices, categories] = await Promise.all([
      readController(getAssetsController, "/api/assets", auth, list),
      readController(getOfficesController, "/api/offices", auth, {
        limit: 100,
        isActive: true,
      }),
      readController(getCategoriesController, "/api/categories", auth, {
        limit: 100,
        isActive: true,
      }),
    ]);

    setList(queryClient, "assets", list, assets);
    if (offices) queryClient.setQueryData(["offices"], offices.data ?? []);
    if (categories) {
      queryClient.setQueryData(["categories", { isActive: true }], categories.data ?? []);
    }
  });
}

export function prefetchAssignments(params: AppSearchParams) {
  return prepare(async (queryClient, auth) => {
    const list = listParams(params, {
      search: readParam(params, "search"),
      isActive: readActive(params),
    });
    const canManage =
      auth.role === "SUPER_ADMIN" || auth.role === "MANAGER" || auth.role === "ADMIN";
    const assetParams = { status: "AVAILABLE", limit: 100 };
    const userParams = { limit: 100, role: "USER" };

    const [assignments, assets, users] = await Promise.all([
      readController(getAssignmentsController, "/api/assignments", auth, list),
      readController(getAssetsController, "/api/assets", auth, assetParams),
      canManage
        ? readController(getUsersController, "/api/users", auth, userParams)
        : Promise.resolve(null),
    ]);

    setList(queryClient, "assignments", list, assignments);
    if (assets) queryClient.setQueryData(["assets", assetParams], assets.data ?? []);
    if (users) queryClient.setQueryData(["users", userParams], users.data ?? []);
  });
}

export function prefetchMaintenance(params: AppSearchParams) {
  return prepare(async (queryClient, auth) => {
    const search = readParam(params, "search");
    const status = readParam(params, "status");
    const list = listParams(params, {
      search,
      status: !status || status === "ALL" ? undefined : status,
    });
    const summaryParams = { limit: 100, search };
    const assetParams = { limit: 100 };

    const [records, summary, assets] = await Promise.all([
      readController(getMaintenanceController, "/api/maintenance", auth, list),
      readController(getMaintenanceController, "/api/maintenance", auth, summaryParams),
      readController(getAssetsController, "/api/assets", auth, assetParams),
    ]);

    setList(queryClient, "maintenance", list, records);
    if (summary) queryClient.setQueryData(["maintenance", summaryParams], summary.data ?? []);
    if (assets) queryClient.setQueryData(["assets", assetParams], assets.data ?? []);
  });
}

export function prefetchUsers(params: AppSearchParams) {
  return prepare(async (queryClient, auth) => {
    const list = listParams(params, {
      search: readParam(params, "search"),
      role: readParam(params, "role"),
    });

    const [users, offices] = await Promise.all([
      readController(getUsersController, "/api/users", auth, list),
      readController(getOfficesController, "/api/offices", auth, {
        limit: 100,
        isActive: true,
      }),
    ]);

    setList(queryClient, "users", list, users);
    if (offices) queryClient.setQueryData(["offices"], offices.data ?? []);
  });
}

export function prefetchOffices(params: AppSearchParams) {
  return prepare(async (queryClient, auth) => {
    const directory = {
      search: readParam(params, "search"),
      page: readPage(params),
      limit: LIST_PAGE_SIZE,
      isActive: readActive(params),
    };
    const result = await readController(
      getOfficesController,
      "/api/offices",
      auth,
      directory,
    );
    if (!result) return;
    const items = Array.isArray(result.data) ? result.data : [];
    queryClient.setQueryData(["offices", "directory", directory], {
      items,
      pagination: result.pagination ?? {
        page: directory.page,
        limit: directory.limit,
        total: items.length,
        totalPages: items.length ? 1 : 0,
      },
    });
  });
}

export function prefetchCategories(params: AppSearchParams) {
  return prepare(async (queryClient, auth) => {
    const list = listParams(params, {
      search: readParam(params, "search"),
      isActive: readActive(params),
    });
    const result = await readController(
      getCategoriesController,
      "/api/categories",
      auth,
      list,
    );
    setList(queryClient, "categories", list, result);
  });
}

export function prefetchDocuments(params: AppSearchParams) {
  return prepare(async (queryClient, auth) => {
    const list = listParams(params, {
      search: readParam(params, "search"),
    });
    const result = await readController(
      getDocumentsController,
      "/api/documents",
      auth,
      list,
    );
    setList(queryClient, "documents", list, result);
  });
}

export function prefetchAuditLogs(params: AppSearchParams) {
  return prepare(async (queryClient, auth) => {
    const list = listParams(params, {
      search: readParam(params, "search"),
    });
    const result = await readController(
      getAuditLogsController,
      "/api/audit-logs",
      auth,
      list,
    );
    setList(queryClient, "audit-logs", list, result);
  });
}

export function prefetchReports() {
  return prepare(async (queryClient, auth) => {
    const result = await readController(getReportsController, "/api/reports", auth);
    if (result) queryClient.setQueryData(["reports"], result.data);
  });
}

export function prefetchSettings() {
  return prepare(async (queryClient, auth) => {
    const result = await readController(getCompanyController, "/api/company", auth);
    if (result) queryClient.setQueryData(["company"], result.data);
  });
}
