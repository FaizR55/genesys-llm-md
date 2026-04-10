import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-api-key'];
    const expectedKey = this.config.get<string>('API_KEY');

    if (!expectedKey) {
      this.logger.warn('API_KEY is not configured in environment');
      throw new UnauthorizedException('API key not configured');
    }

    if (!providedKey || providedKey !== expectedKey) {
      this.logger.warn(
        `Unauthorized request from IP ${request.ip} — invalid or missing x-api-key`,
      );
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
