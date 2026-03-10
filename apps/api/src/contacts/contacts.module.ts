import { Module, forwardRef } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { MessagesService } from './messages.service';
import { MessagingModule } from '../messaging/messaging.module';
import { AgentConfigModule } from '../agent-config/agent-config.module';

@Module({
  imports: [forwardRef(() => MessagingModule), forwardRef(() => AgentConfigModule)],
  controllers: [ContactsController],
  providers: [ContactsService, MessagesService],
  exports: [ContactsService, MessagesService],
})
export class ContactsModule {}
