let navigate: ((path: string) => void) | null = null;

export function setNavigate(fn: (path: string) => void) {
  navigate = fn;
}

export function navigateTo(path: string) {
  navigate?.(path);
}
