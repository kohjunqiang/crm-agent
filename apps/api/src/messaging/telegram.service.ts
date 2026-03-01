import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  parseInboundMessage(
    body: any,
  ): {
    chatId: string;
    messageId: number;
    text: string;
    firstName: string | null;
  } | null {
    const message = body?.message;
    if (!message || typeof message.text !== 'string') {
      return null;
    }

    return {
      chatId: String(message.chat.id),
      messageId: message.message_id,
      text: message.text,
      firstName: message.from?.first_name ?? null,
    };
  }

  async sendMessage(
    botToken: string,
    chatId: string,
    text: string,
  ): Promise<void> {
    try {
      await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text }),
        },
      );
    } catch (error) {
      this.logger.error('Failed to send Telegram message', error);
    }
  }

  async setWebhook(
    botToken: string,
    webhookUrl: string,
  ): Promise<boolean> {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl }),
        },
      );
      const data = (await res.json()) as { ok: boolean };
      return data.ok === true;
    } catch (error) {
      this.logger.error('Failed to set Telegram webhook', error);
      return false;
    }
  }
}
