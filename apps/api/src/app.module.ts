import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EnvConfigModule } from './config/env.config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { MessagingModule } from './messaging/messaging.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { AgentConfigModule } from './agent-config/agent-config.module';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [EnvConfigModule, SupabaseModule, AuthModule, ContactsModule, MessagingModule, KnowledgeModule, AgentConfigModule, AgentModule],
  controllers: [AppController],
})
export class AppModule {}
