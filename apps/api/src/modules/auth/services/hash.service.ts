import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';

@Injectable()
export class HashService {
  constructor(private readonly configService: ConfigService) {}

  async hash(value: string) {
    const saltRounds = this.configService.getOrThrow<number>('BCRYPT_SALT_ROUNDS');
    return hash(value, saltRounds);
  }

  async compare(value: string, valueHash: string) {
    return compare(value, valueHash);
  }
}
