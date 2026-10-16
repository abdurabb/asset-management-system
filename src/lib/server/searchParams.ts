export type AppSearchParams = Record<string, string | string[] | undefined>;

export function readParam(params: AppSearchParams, key: string) {
  const value = params[key];
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  return raw;
}

export function readPage(params: AppSearchParams) {
  return Math.max(1, Number(readParam(params, "page") || 1) || 1);
}

export function readActive(params: AppSearchParams) {
  const active = readParam(params, "active");
  if (active === undefined) return undefined;
  return active === "true";
}
