export const ACCESS_TOKEN_COOKIE = 'crm_access_token';
export const REFRESH_TOKEN_COOKIE = 'crm_refresh_token';

export const PUBLIC_ONLY_PATHS = ['/login'] as const;
export const PROTECTED_PATH_PREFIXES = [
  '/dashboard',
  '/orders',
  '/returns',
  '/my-finance',
  '/admin-finance',
  '/users',
] as const;
