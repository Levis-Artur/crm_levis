import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HashService } from '../auth/services/hash.service';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { presentUser, userWithRoleInclude } from './presenters/user.presenter';
import type { CreateUserDto } from './dto/create-user.dto';
import type { ListUsersQueryDto } from './dto/list-users-query.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { normalizeEmail, normalizePhone } from './utils/user-identity.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
    private readonly hashService: HashService,
  ) {}

  async listUsers(query: ListUsersQueryDto) {
    const search = query.search?.trim();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      roleCode: query.roleCode,
      isActive: query.isActive,
      OR: search
        ? [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ]
        : undefined,
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: userWithRoleInclude,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const pageCount = total > 0 ? Math.ceil(total / limit) : 0;

    return {
      items: users.map((user) => presentUser(user)),
      total,
      page,
      limit,
      pageCount,
    };
  }

  async createUser(dto: CreateUserDto) {
    await this.rolesService.ensureRoleExists(dto.roleCode);

    const email = normalizeEmail(dto.email);
    const phone = normalizePhone(dto.phone);

    this.ensureUserHasIdentifier(email, phone);

    try {
      const user = await this.prisma.user.create({
        data: {
          roleCode: dto.roleCode,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email,
          phone,
          passwordHash: await this.hashService.hash(dto.password),
          isActive: dto.isActive ?? true,
        },
        include: userWithRoleInclude,
      });

      return presentUser(user);
    } catch (error) {
      this.rethrowAsHttpError(error);
    }
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const existingUser = await this.getUserOrThrow(userId);

    const roleCode = dto.roleCode ?? existingUser.roleCode;
    const email = dto.email !== undefined ? normalizeEmail(dto.email) : existingUser.email;
    const phone = dto.phone !== undefined ? normalizePhone(dto.phone) : existingUser.phone;

    this.ensureUserHasIdentifier(email, phone);

    if (dto.roleCode) {
      await this.rolesService.ensureRoleExists(dto.roleCode);
    }

    const data: Prisma.UserUncheckedUpdateInput = {
      roleCode,
      firstName: dto.firstName?.trim() ?? existingUser.firstName,
      lastName: dto.lastName?.trim() ?? existingUser.lastName,
      email,
      phone,
    };

    if (dto.password) {
      data.passwordHash = await this.hashService.hash(dto.password);
      data.refreshTokenHash = null;
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
        include: userWithRoleInclude,
      });

      return presentUser(user);
    } catch (error) {
      this.rethrowAsHttpError(error);
    }
  }

  async setUserActivation(userId: string, isActive: boolean) {
    await this.getUserOrThrow(userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
        ...(isActive ? {} : { refreshTokenHash: null }),
      },
      include: userWithRoleInclude,
    });

    return presentUser(user);
  }

  private async getUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userWithRoleInclude,
    });

    if (!user) {
      throw new NotFoundException(`User "${userId}" was not found.`);
    }

    return user;
  }

  private ensureUserHasIdentifier(email: string | null, phone: string | null) {
    if (!email && !phone) {
      throw new BadRequestException('User must have at least one identifier: email or phone.');
    }
  }

  private rethrowAsHttpError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(', ')
        : 'email or phone';

      throw new ConflictException(`User with the same ${target} already exists.`);
    }

    throw error;
  }
}
