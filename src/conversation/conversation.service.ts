import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, MessageRole } from './conversation.entity';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
  ) {}

  async saveMessage(
    conversationId: string,
    userId: string,
    message: string,
    role: MessageRole,
  ): Promise<Conversation> {
    const entry = this.conversationRepo.create({
      conversationId,
      userId,
      message,
      role,
    });
    const saved = await this.conversationRepo.save(entry);
    this.logger.debug(`Saved ${role} message for conversation ${conversationId}`);
    return saved;
  }

  async getHistory(conversationId: string, limit = 20): Promise<Conversation[]> {
    const rows = await this.conversationRepo.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.reverse();
  }
}
