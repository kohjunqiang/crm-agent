import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EnvConfigModule } from './config/env.config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [EnvConfigModule, SupabaseModule, AuthModule, ContactsModule, MessagingModule],
  controllers: [AppController],
})
export class AppModule {}
