import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { callAgent, LLMClient } from '@unified-llm/core';

type AgentProvider = 'openai' | 'google' | 'anthropic' | 'ollama' | 'deepseek';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly provider: AgentProvider;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpoint?: string;

  constructor(private readonly config: ConfigService) {
    const llmProvider = this.config.get<string>('LLM_PROVIDER', 'ollama')?.toLowerCase();

    if (llmProvider === 'google') {
      this.provider = 'google';
      this.apiKey = this.config.get<string>('GEMINI_API_KEY', '');
      this.model = this.config.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
      if (!this.apiKey) throw new Error('GEMINI_API_KEY_MISSING');
    } else if (llmProvider === 'openai') {
      this.provider = 'openai';
      this.apiKey = this.config.get<string>('OPENAI_API_KEY', '');
      this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
      this.endpoint = this.config.get<string>('OPENAI_ENDPOINT');
      if (!this.apiKey) throw new Error('OPENAI_API_KEY_MISSING');
    } else if (llmProvider === 'anthropic' || llmProvider === 'claude') {
      this.provider = 'anthropic';
      this.apiKey = this.config.get<string>('ANTHROPIC_API_KEY', '');
      this.model = this.config.get<string>('ANTHROPIC_MODEL', 'claude-3-haiku-20240307');
      if (!this.apiKey) throw new Error('ANTHROPIC_API_KEY_MISSING');
    } else if (llmProvider === 'ollama') {
      this.provider = 'ollama';
      this.apiKey = this.config.get<string>('OLLAMA_API_KEY', 'ollama');
      this.model = this.config.get<string>('OLLAMA_MODEL', 'qwen2.5');
      // LLMClient for Ollama requires baseURL with /v1 suffix (OpenAI-compatible)
      const base = this.config.get<string>('OLLAMA_ENDPOINT', 'http://localhost:11434');
      this.endpoint = base.endsWith('/v1') ? base : `${base}/v1`;
      this.logger.log(`Ollama configured at: ${this.endpoint}`);
    } else if (llmProvider === 'deepseek') {
      this.provider = 'deepseek';
      this.apiKey = this.config.get<string>('DEEPSEEK_API_KEY', '');
      this.model = this.config.get<string>('DEEPSEEK_MODEL', 'deepseek-chat');
      if (!this.apiKey) throw new Error('DEEPSEEK_API_KEY_MISSING');
    } else {
      throw new Error(`Unsupported LLM_PROVIDER: ${llmProvider}. Use: google, openai, anthropic, ollama, or deepseek`);
    }

    this.logger.log(`LLM Service initialized — provider: ${this.provider}, model: ${this.model}`);
  }

  async generate(prompt: string): Promise<string> {
    this.logger.debug(`Calling ${this.provider} (${this.model}), prompt length=${prompt.length}`);

    try {
      let reply: string;

      if (this.provider === 'ollama' || this.provider === 'openai') {
        // Use LLMClient (Chat Completions API) for ollama and openai
        reply = await this.generateWithLLMClient(prompt);
      } else {
        const agentOptions: any = {
          provider: this.provider,
          model: this.model,
          apiKey: this.apiKey,
          baseInput: [{ role: 'user', content: prompt }],
        };
        if (this.endpoint) agentOptions.endpoint = this.endpoint;

        const result = await callAgent(agentOptions);
        reply = ((result.output as string) ?? '').trim();
        this.logger.debug(`Token usage — input: ${result.usage?.inputTokens}, output: ${result.usage?.outputTokens}`);
      }

      this.logger.debug(`Response from ${this.provider}, length=${reply.length}`);
      return reply;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes('timeout') || errorMsg.includes('ECONNABORTED')) {
        this.logger.error(`${this.provider} request timed out`);
        throw new Error('LLM_TIMEOUT');
      }

      this.logger.error(`${this.provider} request failed: ${errorMsg}`);
      throw error;
    }
  }

  private async generateWithLLMClient(prompt: string): Promise<string> {
    const client = new LLMClient({
      provider: this.provider === 'openai' ? 'openai' : 'ollama',
      apiKey: this.apiKey,
      model: this.model,
      ...(this.endpoint ? { baseURL: this.endpoint } : {}),
    });

    const response = await client.chat({
      messages: [{ role: 'user', content: prompt }],
      model: this.model,
    });

    return (response?.text ?? '').trim();
  }
}
