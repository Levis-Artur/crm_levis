import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

function parseBooleanString(value: unknown) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}

export class UpdateUserStatusDto {
  @Transform(({ value }) => parseBooleanString(value))
  @IsBoolean()
  isActive!: boolean;
}
