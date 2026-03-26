export type AppRole = 'admin' | 'manager';

export interface AuthenticatedUserRole {
  code: AppRole;
  name: string;
  description: string | null;
}

export interface AuthenticatedUser {
  id: string;
  roleCode: AppRole;
  role: AuthenticatedUserRole;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokensPayload {
  tokenType: 'Bearer';
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface LoginResponse extends AuthTokensPayload {
  user: AuthenticatedUser;
}

export interface SessionResponse {
  user: AuthenticatedUser;
}
