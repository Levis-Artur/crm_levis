import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { AppRole } from '../../roles/role-code.enum';

function parseBooleanString(value: unknown) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}

function parseInteger(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number.parseInt(value, 10);
  }

  return value;
}

function optionalTrim(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class ListUsersQueryDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsEnum(AppRole)
  roleCode?: AppRole;

  @Transform(({ value }) => parseBooleanString(value))
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Transform(({ value }) => parseInteger(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Transform(({ value }) => parseInteger(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
