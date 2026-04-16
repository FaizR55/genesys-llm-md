import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class HistoryQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  conversationId?: string;

  @Transform(({ value }) =>
    value === undefined ? 1 : Number.parseInt(String(value), 10),
  )
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) =>
    value === undefined ? 20 : Number.parseInt(String(value), 10),
  )
  @IsInt()
  @Min(1)
  perPage = 20;
}