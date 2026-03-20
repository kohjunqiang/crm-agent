import {
  Controller,
  Post,
  Param,
  Body,
  Logger,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { MessagesService } from './messages.service';
import { AgentConfigService } from '../agent-config/agent-config.service';
import { WhatsAppService } from '../messaging/whatsapp.service';
import { TelegramService } from '../messaging/telegram.service';
import { CurrentUser, RequestUser } from '../auth/user.decorator';

@Controller('api/contacts')
export class ContactsController {
  private readonly logger = new Logger(ContactsController.name);

  constructor(
    private readonly contactsService: ContactsService,
    private readonly messagesService: MessagesService,
    private readonly agentConfigService: AgentConfigService,
    private readonly whatsAppService: WhatsAppService,
    private readonly telegramService: TelegramService,
  ) {}

  @Post(':id/messages')
  async sendMessage(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    const contact = await this.contactsService.getContact(user.id, id);

    const message = await this.messagesService.saveMessage({
      contact_id: id,
      user_id: user.id,
      direction: 'outbound',
      sender: 'human',
      channel: contact.channel,
      content: body.content,
    });

    await this.contactsService.updateLastMessage(id, body.content);

    // Send via the appropriate channel
    const config = await this.agentConfigService.getConfig(user.id);
    let warning: string | undefined;

    if (contact.channel === 'whatsapp') {
      if (config.whatsapp_phone_id && config.whatsapp_token) {
        try {
          await this.whatsAppService.sendMessage(
            config.whatsapp_phone_id,
            config.whatsapp_token,
            contact.phone!,
            body.content,
          );
        } catch (err) {
          this.logger.error(`Failed to send WhatsApp message: ${err}`);
          warning = 'Message saved but failed to send via WhatsApp';
        }
      } else {
        warning = 'WhatsApp not configured';
      }
    } else if (contact.channel === 'telegram') {
      if (config.telegram_bot_token) {
        try {
          await this.telegramService.sendMessage(
            config.telegram_bot_token,
            contact.telegram_chat_id!,
            body.content,
            contact.telegram_business_connection_id,
          );
        } catch (err) {
          this.logger.error(`Failed to send Telegram message: ${err}`);
          warning = 'Message saved but failed to send via Telegram';
        }
      } else {
        warning = 'Telegram not configured';
      }
    }

    if (warning) {
      return { message, warning };
    }
    return message;
  }
}
