import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { MessagesService } from './messages.service';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService, MessagesService],
  exports: [ContactsService, MessagesService],
})
export class ContactsModule {}
