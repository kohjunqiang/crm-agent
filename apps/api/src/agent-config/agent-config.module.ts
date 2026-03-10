import { Module, forwardRef } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { AgentConfigController } from './agent-config.controller';
import { AgentConfigService } from './agent-config.service';

@Module({
  imports: [forwardRef(() => MessagingModule)],
  controllers: [AgentConfigController],
  providers: [AgentConfigService],
  exports: [AgentConfigService],
})
export class AgentConfigModule {}
