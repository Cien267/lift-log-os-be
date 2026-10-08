export interface JwtPayload {
  sub: string;
  sid: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: string;
  sessionId: string;
}

export interface ClientMeta {
  ip: string | null;
  userAgent: string | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  expiresIn: number;
  user: { id: string; email: string; name: string };
}

export type RevokeReason =
  | 'rotated'
  | 'logout'
  | 'logout_all'
  | 'password_changed'
  | 'reuse_detected'
  | 'revoked_by_user';
