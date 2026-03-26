import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureRoleExists(roleCode: string) {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
    });

    if (!role) {
      throw new BadRequestException(`Role "${roleCode}" does not exist.`);
    }

    return role;
  }
}
