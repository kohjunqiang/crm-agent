import { Module, forwardRef } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { MessagingModule } from '../messaging/messaging.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { AgentConfigModule } from '../agent-config/agent-config.module';
import { AgentService } from './agent.service';
import { PromptService } from './prompt.service';
import { ToolExecutorService } from './tool-executor.service';

@Module({
  imports: [
    forwardRef(() => ContactsModule),
    forwardRef(() => MessagingModule),
    KnowledgeModule,
    forwardRef(() => AgentConfigModule),
  ],
  providers: [AgentService, PromptService, ToolExecutorService],
  exports: [AgentService],
})
export class AgentModule {}
