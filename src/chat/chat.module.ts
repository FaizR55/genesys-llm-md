import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationModule } from '../conversation/conversation.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [ConversationModule, LlmModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
