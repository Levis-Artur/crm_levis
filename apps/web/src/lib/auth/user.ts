import type { AuthenticatedUser } from './types';

export function getUserDisplayName(user: AuthenticatedUser) {
  return `${user.firstName} ${user.lastName}`.trim();
}
