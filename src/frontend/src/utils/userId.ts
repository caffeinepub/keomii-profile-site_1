import { ADMIN_PRINCIPAL } from "../constants";

export function normalizePrincipal(principal: string): string {
  return principal.trim().replace(/-+$/, "");
}

export function getUserId(principal: string): string {
  if (normalizePrincipal(principal) === normalizePrincipal(ADMIN_PRINCIPAL))
    return "Keoji";
  return principal.slice(0, 8);
}

export function isAdminPrincipal(principal: string): boolean {
  return normalizePrincipal(principal) === normalizePrincipal(ADMIN_PRINCIPAL);
}
