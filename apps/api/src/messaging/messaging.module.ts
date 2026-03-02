import { Module, forwardRef } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AgentModule } from '../agent/agent.module';
import { TelegramService } from './telegram.service';
import { MessagingController } from './messaging.controller';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [ContactsModule, SupabaseModule, forwardRef(() => AgentModule)],
  controllers: [TelegramWebhookController, MessagingController],
  providers: [TelegramService, WhatsAppService],
  exports: [TelegramService, WhatsAppService],
})
export class MessagingModule {}
