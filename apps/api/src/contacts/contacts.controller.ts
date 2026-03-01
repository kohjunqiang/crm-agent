import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
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
}
