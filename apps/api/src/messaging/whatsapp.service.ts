import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsAppService {

  validateSignature(
    rawBody: Buffer,
    signature: string,
    appSecret: string,
  ): boolean {
    const computed = createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    const expected = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;

    if (computed.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(Buffer.from(computed), Buffer.from(expected));
  }

  parseInboundMessage(
    body: any,
  ): {
    from: string;
    messageId: string;
    text: string;
    contactName: string | null;
    phoneNumberId: string;
    timestamp: number | null;
  } | null {
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    if (!value) return null;

    const messages = value.messages;
    if (!Array.isArray(messages) || messages.length === 0) return null;

    const message = messages[0];
    if (message.type !== 'text') return null;

    const text = message.text?.body;
    if (typeof text !== 'string') return null;

    return {
      from: message.from,
      messageId: message.id,
      text,
      contactName: value.contacts?.[0]?.profile?.name ?? null,
      phoneNumberId: value.metadata?.phone_number_id,
      timestamp: message.timestamp ? Number(message.timestamp) : null,
    };
  }

  async sendMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    text: string,
  ): Promise<void> {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`WhatsApp API ${res.status}: ${body}`);
    }
  }
}
