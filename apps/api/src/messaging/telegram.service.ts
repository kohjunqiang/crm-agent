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
    businessConnectionId?: string;
  } | null {
    // Support both regular messages and Telegram Business messages
    const message = body?.business_message ?? body?.message;
    if (!message || typeof message.text !== 'string') {
      return null;
    }

    return {
      chatId: String(message.chat.id),
      messageId: message.message_id,
      text: message.text,
      firstName: message.from?.first_name ?? null,
      businessConnectionId: message.business_connection_id ?? undefined,
    };
  }

  async sendMessage(
    botToken: string,
    chatId: string,
    text: string,
    businessConnectionId?: string | null,
  ): Promise<void> {
    const payload: Record<string, string> = { chat_id: chatId, text };
    if (businessConnectionId) {
      payload.business_connection_id = businessConnectionId;
    }

    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Telegram API ${res.status}: ${body}`);
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
          body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: [
              'message',
              'business_connection',
              'business_message',
            ],
          }),
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
