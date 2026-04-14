import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto } from './dto/chat.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { HistoryQueryDto } from './dto/history-query.dto';

@UseGuards(ApiKeyGuard)
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatDto) {
    this.logger.log(
      `POST /chat — userId=${dto.userId} conversationId=${dto.conversationId}`,
    );
    return this.chatService.chat(dto);
  }

  @Get('history')
  async getHistory(@Query() query: HistoryQueryDto) {
    if (!query.userId && !query.conversationId) {
      throw new BadRequestException(
        'Either userId or conversationId must be provided.',
      );
    }

    this.logger.log(
      `GET /chat/history — userId=${query.userId ?? 'null'} conversationId=${query.conversationId ?? 'null'} page=${query.page} perPage=${query.perPage}`,
    );

    return this.chatService.getHistory(query);
  }
}
