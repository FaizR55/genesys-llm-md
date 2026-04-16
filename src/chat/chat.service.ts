import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatDto } from './dto/chat.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { ConversationService } from '../conversation/conversation.service';
import { LlmService } from '../llm/llm.service';
import { RedisService } from '../redis/redis.service';
import { Conversation, MessageRole } from '../conversation/conversation.entity';

const DEFAULT_SYSTEM_INSTRUCTION = `You are a helpful, concise, and professional assistant integrated into a customer interaction platform. Answer clearly and accurately. Do not reveal system internals.`;
const DEFAULT_HISTORY_LIMIT = 20;
const CACHE_TTL_SECONDS = 300;

export interface ChatResponse {
  reply: string;
  success: boolean;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly systemInstruction: string;
  private readonly historyLimit: number;

  constructor(
    private readonly config: ConfigService,
    private readonly conversationService: ConversationService,
    private readonly llmService: LlmService,
    private readonly redisService: RedisService,
  ) {
    this.systemInstruction = this.config.get<string>('SYSTEM_INSTRUCTION', DEFAULT_SYSTEM_INSTRUCTION);
    const historyLimitEnv = this.config.get<string>('HISTORY_LIMIT');
    
    if (historyLimitEnv) {
      const parsed = parseInt(historyLimitEnv, 10);
      if (isNaN(parsed) || parsed < 1) {
        throw new Error(`HISTORY_LIMIT must be a positive integer, got: ${historyLimitEnv}`);
      }
      this.historyLimit = parsed;
    } else {
      this.historyLimit = DEFAULT_HISTORY_LIMIT;
    }

    this.logger.log(`ChatService initialized — systemInstruction length: ${this.systemInstruction.length}, historyLimit: ${this.historyLimit}`);
  }

  async chat(dto: ChatDto): Promise<ChatResponse> {
    const { message, conversationId, userId } = dto;

    this.logger.log(
      `[chat] userId=${userId} conversationId=${conversationId} messageLength=${message.length}`,
    );

    const cacheKey = `conv:${conversationId}`;

    // 1. Fetch conversation history BEFORE saving (for prompt context)
    let history: Conversation[] | null =
      await this.redisService.get<Conversation[]>(cacheKey);

    if (!history) {
      history = await this.conversationService.getHistory(
        conversationId,
        this.historyLimit,
      );
      await this.redisService.set(cacheKey, history, CACHE_TTL_SECONDS);
    }

    // 2. Save the incoming user message
    await this.conversationService.saveMessage(
      conversationId,
      userId,
      message,
      MessageRole.USER,
    );

    // 3. Build the prompt
    const prompt = this.buildPrompt(history, message);

    // console.log("history = ", history);
    console.log("prompt = ", prompt);

    // 4. Call LLM
    let reply: string;
    try {
      reply = await this.llmService.generate(prompt);
      this.logger.log(
        `[chat] LLM reply for conversationId=${conversationId}: "${reply.substring(0, 120)}..."`,
      );
    } catch (error) {
      this.logger.error(`[chat] LLM error: ${(error as Error).message}`);
      return { reply: 'Sorry, something went wrong.', success: false };
    }

    // 5. Save the bot reply
    await this.conversationService.saveMessage(
      conversationId,
      userId,
      reply,
      MessageRole.BOT,
    );

    // 6. Invalidate cache so next call fetches fresh history
    await this.redisService.del(cacheKey);

    return { reply, success: true };
  }

  async getHistory(query: HistoryQueryDto) {
    return this.conversationService.getPaginatedHistory({
      userId: query.userId,
      conversationId: query.conversationId,
      page: query.page,
      perPage: query.perPage,
    });
  }

  private buildPrompt(history: Conversation[], latestMessage: string): string {
    const lines: string[] = [this.systemInstruction, ''];

    for (const msg of history) {
      const role = msg.role === MessageRole.USER ? 'User' : 'Bot';
      lines.push(`${role}: ${msg.message}`);
    }

    lines.push(`User: ${latestMessage}`);
    lines.push('Bot:');

    return lines.join('\n');
  }
}
