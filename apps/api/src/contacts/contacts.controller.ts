import { Controller, Get, Patch, Post, Param, Body } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { MessagesService } from './messages.service';
import { CurrentUser, RequestUser } from '../auth/user.decorator';

@Controller('api/contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    const contacts = await this.contactsService.listContacts(user.id);
    return { contacts };
  }

  @Get(':id')
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const contact = await this.contactsService.getContact(user.id, id);
    const messages = await this.messagesService.getMessages(id, user.id);
    return { contact, messages };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { status?: string; agent_enabled?: boolean; name?: string },
  ) {
    return this.contactsService.updateContact(user.id, id, body);
  }

  @Post(':id/messages')
  async sendMessage(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    const contact = await this.contactsService.getContact(user.id, id);

    // TODO: Actually send via WhatsApp/Telegram (Task 8A)
    const message = await this.messagesService.saveMessage({
      contact_id: id,
      user_id: user.id,
      direction: 'outbound',
      sender: 'human',
      channel: contact.channel,
      content: body.content,
    });

    await this.contactsService.updateLastMessage(id, body.content);

    return message;
  }
}
