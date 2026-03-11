import { ADMIN_PRINCIPAL } from "../constants";

export function getUserId(principal: string): string {
  if (principal === ADMIN_PRINCIPAL) return "Keoji";
  return principal.slice(0, 8);
}
