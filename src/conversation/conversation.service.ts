import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, MessageRole } from './conversation.entity';

export interface PaginatedHistoryQuery {
  userId?: string;
  conversationId?: string;
  page: number;
  perPage: number;
}

export interface PaginatedHistoryResult {
  data: Conversation[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

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

  async getPaginatedHistory(
    query: PaginatedHistoryQuery,
  ): Promise<PaginatedHistoryResult> {
    const { userId, conversationId, page, perPage } = query;

    const queryBuilder = this.conversationRepo
      .createQueryBuilder('conversation')
      .orderBy('conversation.createdAt', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage);

    if (userId) {
      queryBuilder.andWhere('conversation.userId = :userId', { userId });
    }

    if (conversationId) {
      queryBuilder.andWhere('conversation.conversationId = :conversationId', {
        conversationId,
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      page,
      perPage,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / perPage),
    };
  }
}
