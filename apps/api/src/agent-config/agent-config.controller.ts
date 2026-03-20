import {
  Controller,
  Put,
  Post,
  Body,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentConfigService } from './agent-config.service';
import { TelegramService } from '../messaging/telegram.service';
import { CurrentUser, RequestUser } from '../auth/user.decorator';

@Controller('api/config')
export class AgentConfigController {
  private readonly logger = new Logger(AgentConfigController.name);

  constructor(
    private readonly agentConfigService: AgentConfigService,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
  ) {}

  @Put()
  async update(
    @CurrentUser() user: RequestUser,
    @Body()
    body: {
      system_prompt?: string;
      whatsapp_phone_id?: string;
      whatsapp_token?: string;
      whatsapp_verify_token?: string;
      telegram_bot_token?: string;
    },
  ) {
    const config = await this.agentConfigService.updateConfig(user.id, body);

    // Auto-set Telegram webhook when bot token is saved
    let telegram_webhook: { set: boolean; url: string } | undefined;
    if (body.telegram_bot_token) {
      const apiBaseUrl = this.configService.get<string>('API_BASE_URL');
      if (apiBaseUrl) {
        const url = `${apiBaseUrl}/webhooks/telegram/${body.telegram_bot_token}`;
        const set = await this.telegramService.setWebhook(
          body.telegram_bot_token,
          url,
        );
        telegram_webhook = { set, url };
      } else {
        this.logger.warn(
          'API_BASE_URL not configured, skipping Telegram webhook setup',
        );
      }
    }

    return { config, telegram_webhook };
  }

  @Post('telegram/set-webhook')
  async setTelegramWebhook(@CurrentUser() user: RequestUser) {
    const config = await this.agentConfigService.getConfig(user.id);

    if (!config.telegram_bot_token) {
      throw new BadRequestException(
        'Telegram bot token is not configured. Update your config first.',
      );
    }

    const apiBaseUrl = this.configService.get<string>('API_BASE_URL');
    if (!apiBaseUrl) {
      throw new BadRequestException('API_BASE_URL is not configured');
    }

    const webhookUrl = `${apiBaseUrl}/webhooks/telegram/${config.telegram_bot_token}`;
    const success = await this.telegramService.setWebhook(
      config.telegram_bot_token,
      webhookUrl,
    );

    return { success, webhook_url: webhookUrl };
  }
}
