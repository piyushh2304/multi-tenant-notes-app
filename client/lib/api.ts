export function apiUrl(path: string) {
  // Use Vite env if provided (set VITE_API_BASE), otherwise use relative paths to preserve origin/proxy
  const base = (import.meta.env && import.meta.env.VITE_API_BASE) || "";
  if (base) {
    return base.replace(/\/$/, "") + (path.startsWith("/") ? path : `/${path}`);
  }
  return path; // relative path
}
