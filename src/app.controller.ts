import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('config/genesys')
  getGenesysConfig() {
    return {
      environment: this.config.get<string>('GENESYS_ENVIRONMENT', 'prod-apne1'),
      deploymentId: this.config.get<string>('GENESYS_DEPLOYMENT_ID'),
    };
  }
}
