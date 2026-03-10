import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Res,
  HttpCode,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/public.decorator';
import { SupabaseService } from '../supabase/supabase.service';
import { WhatsAppService } from './whatsapp.service';
import { ContactsService } from '../contacts/contacts.service';
import { MessagesService } from '../contacts/messages.service';
import { AgentService } from '../agent/agent.service';

@Controller('webhooks/whatsapp')
export class MessagingController {
  private readonly logger = new Logger(MessagingController.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly supabase: SupabaseService,
    private readonly contactsService: ContactsService,
    private readonly messagesService: MessagesService,
    private readonly config: ConfigService,
    private readonly agentService: AgentService,
  ) {}

  @Public()
  @Get()
  async verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: any,
  ) {
    if (mode !== 'subscribe' || !verifyToken) {
      throw new ForbiddenException();
    }

    const { data: agentConfig } = await this.supabase
      .getClient()
      .from('agent_config')
      .select('user_id')
      .eq('whatsapp_verify_token', verifyToken)
      .maybeSingle();

    if (!agentConfig) {
      throw new ForbiddenException();
    }

    res.set('Content-Type', 'text/plain');
    return res.send(challenge);
  }

  @Public()
  @Post()
  @HttpCode(200)
  async handleWebhook(@Req() req: any, @Body() body: any) {
    // Validate signature
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');

    if (!signature || !appSecret) {
      this.logger.warn('Missing signature or app secret');
      return { ok: true };
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      this.logger.warn('Raw body not available for signature validation');
      return { ok: true };
    }

    if (!this.whatsAppService.validateSignature(rawBody, signature, appSecret)) {
      this.logger.warn('Invalid WhatsApp webhook signature');
      return { ok: true };
    }

    // Parse inbound message
    const parsed = this.whatsAppService.parseInboundMessage(body);
    if (!parsed) {
      return { ok: true };
    }

    // Skip old messages (e.g. backlog delivered when webhook reconnects)
    if (parsed.timestamp && Date.now() / 1000 - parsed.timestamp > 120) {
      this.logger.log(
        `Skipping old WhatsApp message (age: ${Math.round(Date.now() / 1000 - parsed.timestamp)}s)`,
      );
      return { ok: true };
    }

    // Look up agent_config by whatsapp_phone_id
    const { data: agentConfig } = await this.supabase
      .getClient()
      .from('agent_config')
      .select('user_id')
      .eq('whatsapp_phone_id', parsed.phoneNumberId)
      .maybeSingle();

    if (!agentConfig) {
      this.logger.warn(
        `No agent_config found for phone_id: ${parsed.phoneNumberId}`,
      );
      return { ok: true };
    }

    const userId: string = agentConfig.user_id;

    // Dedup by external_id
    const exists = await this.messagesService.existsByExternalId(
      parsed.messageId,
    );
    if (exists) {
      return { ok: true };
    }

    // Find or create contact
    const contact = await this.contactsService.findOrCreateContact(userId, {
      phone: parsed.from,
      channel: 'whatsapp',
      name: parsed.contactName ?? undefined,
    });

    // Save inbound message
    await this.messagesService.saveMessage({
      contact_id: contact.id,
      user_id: userId,
      direction: 'inbound',
      sender: 'lead',
      channel: 'whatsapp',
      content: parsed.text,
      external_id: parsed.messageId,
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
