import { Module } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { TelegramService } from './telegram.service';
import { MessagingController } from './messaging.controller';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [ContactsModule, SupabaseModule],
  controllers: [TelegramWebhookController, MessagingController],
  providers: [TelegramService, WhatsAppService],
  exports: [TelegramService, WhatsAppService],
})
export class MessagingModule {}
