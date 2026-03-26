import type { Prisma } from '@prisma/client';

export const userWithRoleInclude = {
  role: true,
} as const;

export type UserWithRole = Prisma.UserGetPayload<{
  include: typeof userWithRoleInclude;
}>;

export function presentUser(user: UserWithRole) {
  return {
    id: user.id,
    roleCode: user.roleCode,
    role: {
      code: user.role.code,
      name: user.role.name,
      description: user.role.description,
    },
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export type PresentedUser = ReturnType<typeof presentUser>;
