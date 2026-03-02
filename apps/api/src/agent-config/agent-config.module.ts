import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { AgentConfigController } from './agent-config.controller';
import { AgentConfigService } from './agent-config.service';

@Module({
  imports: [MessagingModule],
  controllers: [AgentConfigController],
  providers: [AgentConfigService],
  exports: [AgentConfigService],
})
export class AgentConfigModule {}
