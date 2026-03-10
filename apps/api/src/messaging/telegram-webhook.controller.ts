import { Controller, Post, Param, Body, HttpCode, Logger } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { SupabaseService } from '../supabase/supabase.service';
import { TelegramService } from './telegram.service';
import { ContactsService } from '../contacts/contacts.service';
import { MessagesService } from '../contacts/messages.service';
import { AgentService } from '../agent/agent.service';
import { AgentConfigService } from '../agent-config/agent-config.service';

@Controller('webhooks/telegram')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly supabase: SupabaseService,
    private readonly contactsService: ContactsService,
    private readonly messagesService: MessagesService,
    private readonly agentService: AgentService,
    private readonly agentConfigService: AgentConfigService,
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

    // Handle business_connection event (fired when bot is connected/disconnected from a business account)
    if (body?.business_connection) {
      const bc = body.business_connection;
      if (bc.is_enabled && bc.can_reply) {
        this.agentConfigService
          .updateConfig(userId, {
            telegram_business_connection_id: bc.id,
          })
          .catch((err) =>
            this.logger.error('Failed to store business_connection_id:', err),
          );
        this.logger.log(`Stored business_connection_id: ${bc.id}`);
      } else {
        // Bot was disconnected or lost reply permission — clear connection ID
        this.agentConfigService
          .updateConfig(userId, {
            telegram_business_connection_id: null,
          })
          .catch((err) =>
            this.logger.error('Failed to clear business_connection_id:', err),
          );
        this.logger.log('Cleared business_connection_id (bot disconnected or no reply permission)');
      }
      return { ok: true };
    }

    // Parse the inbound message (supports regular and business messages)
    const parsed = this.telegramService.parseInboundMessage(body);
    if (!parsed) {
      return { ok: true };
    }

    // Skip old messages (e.g. backlog delivered when webhook reconnects)
    const messageDate = (body?.business_message ?? body?.message)?.date;
    if (messageDate && Date.now() / 1000 - messageDate > 120) {
      this.logger.log(
        `Skipping old Telegram message (age: ${Math.round(Date.now() / 1000 - messageDate)}s)`,
      );
      return { ok: true };
    }

    // Store business_connection_id if present (Telegram Business accounts)
    if (parsed.businessConnectionId) {
      this.agentConfigService
        .updateConfig(userId, {
          telegram_business_connection_id: parsed.businessConnectionId,
        })
        .catch((err) =>
          this.logger.error('Failed to store business_connection_id:', err),
        );
    }

    // Dedup by external_id
    const externalId = `tg_${parsed.messageId}`;
    const exists = await this.messagesService.existsByExternalId(externalId);
    if (exists) {
      return { ok: true };
    }

    // Find or create contact (store business_connection_id per contact)
    const contact = await this.contactsService.findOrCreateContact(userId, {
      telegram_chat_id: parsed.chatId,
      telegram_business_connection_id: parsed.businessConnectionId,
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

    // Fire-and-forget: agent processes asynchronously, webhook returns 200 immediately
    if (contact.agent_enabled) {
      this.agentService
        .processInboundMessage(contact.id, userId, parsed.text)
        .catch((err) => this.logger.error('Agent error:', err));
    }

    return { ok: true };
  }
}
