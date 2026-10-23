import type { UserType } from "./types";

export function dashboardFor(userType: UserType): string {
  return userType === "admin" ? "/admin" : userType === "company" ? "/empresa" : "/candidato";
}

export function safeReturnPath(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return fallback;
  const url = new URL(value, "https://return.invalid");
  if (url.origin !== "https://return.invalid" || url.pathname === "/login" || url.pathname === "/cadastro") return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
