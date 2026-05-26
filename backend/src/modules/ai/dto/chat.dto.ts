import { IsString, IsNotEmpty, IsArray, IsOptional, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString() @IsNotEmpty()
  content!: string;

  @IsString() @IsOptional()
  timestamp: string = new Date().toISOString();
}

export class ChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  @IsOptional()
  history: ChatMessageDto[] = [];

  @IsString() @IsNotEmpty()
  question!: string;
}
