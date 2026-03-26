import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AppRole } from '../../roles/role-code.enum';

function optionalTrim(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class CreateUserDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsEnum(AppRole)
  roleCode!: AppRole;

  @Transform(({ value }) => optionalTrim(value))
  @IsString()
  @MinLength(1)
  firstName!: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString()
  @MinLength(1)
  lastName!: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsEmail()
  email?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(5)
  phone?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
