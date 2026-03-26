import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ManagerPayoutStatus } from '../finance.enums';
import { parseDate, parseInteger, optionalTrim } from './dto-transformers';

export class ListFinancePayoutsQueryDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @IsOptional()
  @IsEnum(ManagerPayoutStatus)
  status?: ManagerPayoutStatus;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  periodFrom?: Date;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  periodTo?: Date;

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
