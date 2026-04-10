import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.replace(/<[^>]*>/g, '').trim()
      : value,
  )
  message!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  conversationId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  userId!: string;
}
