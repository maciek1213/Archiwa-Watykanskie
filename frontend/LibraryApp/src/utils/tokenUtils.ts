export interface TokenPayload {
  sub: string;
  email?: string;
  roles?: string[];
  userId?: number;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);

    const decoded = atob(paddedPayload);
    const parsed = JSON.parse(decoded);

    return parsed as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function isAdmin(token: string | null): boolean {
  if (!token) return false;

  const payload = decodeToken(token);
  if (!payload) return false;

  if (payload.roles && Array.isArray(payload.roles)) {
    return payload.roles.includes("ROLE_ADMIN");
  }

  return (
    (payload as any)?.role === "admin" || (payload as any)?.role === "ADMIN"
  );
}

export function getUserId(token: string | null): number | null {
  if (!token) return null;

  const payload = decodeToken(token);
  return payload?.userId || null;
}
