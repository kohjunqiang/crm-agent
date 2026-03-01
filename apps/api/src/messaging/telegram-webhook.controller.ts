import { Controller, Post, Param, Body, HttpCode, Logger } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { SupabaseService } from '../supabase/supabase.service';
import { TelegramService } from './telegram.service';
import { ContactsService } from '../contacts/contacts.service';
import { MessagesService } from '../contacts/messages.service';

@Controller('webhooks/telegram')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly supabase: SupabaseService,
    private readonly contactsService: ContactsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Public()
  @Post(':botToken')
  @HttpCode(200)
  async handleUpdate(
    @Param('botToken') botToken: string,
    @Body() body: any,
  ) {
    // Look up agent_config by telegram_bot_token
    const { data: config } = await this.supabase
      .getClient()
      .from('agent_config')
      .select('user_id')
      .eq('telegram_bot_token', botToken)
      .maybeSingle();

    if (!config) {
      return { ok: true };
    }

    const userId: string = config.user_id;

    // Parse the inbound message
    const parsed = this.telegramService.parseInboundMessage(body);
    if (!parsed) {
      return { ok: true };
    }

    // Dedup by external_id
    const externalId = `tg_${parsed.messageId}`;
    const exists = await this.messagesService.existsByExternalId(externalId);
    if (exists) {
      return { ok: true };
    }

    // Find or create contact
    const contact = await this.contactsService.findOrCreateContact(userId, {
      telegram_chat_id: parsed.chatId,
      channel: 'telegram',
      name: parsed.firstName ?? undefined,
    });

    // Save inbound message
    await this.messagesService.saveMessage({
      contact_id: contact.id,
      user_id: userId,
      direction: 'inbound',
      sender: 'lead',
      channel: 'telegram',
      content: parsed.text,
      external_id: externalId,
    });

    // Update last message preview
    await this.contactsService.updateLastMessage(contact.id, parsed.text);

    // TODO: if contact.agent_enabled, call agent
    if (contact.agent_enabled) {
      this.logger.log('Agent would reply here');
    }

    return { ok: true };
  }
}
