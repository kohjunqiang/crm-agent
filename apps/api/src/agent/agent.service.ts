import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ContactsService } from '../contacts/contacts.service';
import { MessagesService } from '../contacts/messages.service';
import { AgentConfigService } from '../agent-config/agent-config.service';
import { WhatsAppService } from '../messaging/whatsapp.service';
import { TelegramService } from '../messaging/telegram.service';
import { PromptService } from './prompt.service';
import { ToolExecutorService } from './tool-executor.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly anthropic: Anthropic | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly contactsService: ContactsService,
    private readonly messagesService: MessagesService,
    private readonly agentConfigService: AgentConfigService,
    private readonly whatsappService: WhatsAppService,
    private readonly telegramService: TelegramService,
    private readonly promptService: PromptService,
    private readonly toolExecutor: ToolExecutorService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  /**
   * Main agent loop. Called when an inbound message arrives.
   * The agent decides which tools to use and generates a reply.
   *
   * Flow:
   * 1. Load context (contact, history, config)
   * 2. Send to Claude with tool definitions
   * 3. If Claude wants to use tools → execute them → send results back
   * 4. Extract final text reply
   * 5. Send reply via channel + save to DB
   */
  async processInboundMessage(
    contactId: string,
    userId: string,
    messageContent: string,
  ): Promise<void> {
    try {
      // 1. PERCEIVE — Load context
      const contact = await this.contactsService.getContact(userId, contactId);
      if (!contact.agent_enabled) {
        this.logger.log(
          `Agent disabled for contact ${contactId}, skipping`,
        );
        return;
      }

      const messages = await this.messagesService.getMessages(
        contactId,
        userId,
      );
      const config = await this.agentConfigService.getConfig(userId);

      // 2. REASON — Build prompt and call Claude with tools
      let replyText: string;

      if (!this.anthropic) {
        this.logger.warn(
          'ANTHROPIC_API_KEY not set, skipping agent reply',
        );
        return;
      } else {
        const systemPrompt = this.promptService.buildSystemPrompt(
          config.system_prompt,
          contact.channel,
        );
        const conversationMessages = this.promptService.buildMessages(
          messages,
          messageContent,
        );
        const tools = this.promptService.getTools();

        this.logger.log(
          `Agent processing message for contact ${contactId}: "${messageContent.substring(0, 50)}..."`,
        );

        let response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          system: systemPrompt,
          messages: conversationMessages,
          tools,
        });

        // 3. ACT — Process tool calls in a loop (max 5 iterations to prevent runaway)
        let currentMessages: any[] = [...conversationMessages];
        let iterations = 0;
        const MAX_ITERATIONS = 5;

        while (
          response.stop_reason === 'tool_use' &&
          iterations < MAX_ITERATIONS
        ) {
          iterations++;
          this.logger.log(`Agent tool use iteration ${iterations}`);

          // Execute each tool call
          const toolResults: any[] = [];
          for (const block of response.content) {
            if (block.type === 'tool_use') {
              this.logger.log(
                `Agent calling tool: ${block.name}(${JSON.stringify(block.input)})`,
              );
              const result = await this.toolExecutor.execute(
                block.name,
                block.input as Record<string, any>,
                userId,
                contactId,
              );
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: result,
              });
            }
          }

          // Send tool results back to Claude for next reasoning step
          currentMessages = [
            ...currentMessages,
            { role: 'assistant' as const, content: response.content },
            { role: 'user' as const, content: toolResults },
          ];

          response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1024,
            system: systemPrompt,
            messages: currentMessages,
            tools,
          });
        }

        if (iterations >= MAX_ITERATIONS) {
          this.logger.warn(
            `Agent hit max iterations (${MAX_ITERATIONS}) for contact ${contactId}`,
          );
        }

        // 4. RESPOND — Extract the final text reply
        replyText = response.content
          .filter(
            (block): block is Anthropic.TextBlock => block.type === 'text',
          )
          .map((block) => block.text)
          .join('\n')
          .trim();
      }

      if (!replyText) {
        this.logger.warn(
          `Agent produced empty reply for contact ${contactId}`,
        );
        return;
      }

      // 5. Send reply via the original channel
      await this.sendReply(contact, config, replyText);

      // 6. Save outbound message
      await this.messagesService.saveMessage({
        contact_id: contactId,
        user_id: userId,
        direction: 'outbound',
        sender: 'agent',
        channel: contact.channel,
        content: replyText,
      });

      // 7. Update contact
      await this.contactsService.updateLastMessage(contactId, replyText);
      if (contact.status === 'new') {
        await this.contactsService.updateContact(userId, contactId, {
          status: 'engaged',
        });
      }

      this.logger.log(
        `Agent replied to contact ${contactId} on ${contact.channel}: "${replyText.substring(0, 50)}..."`,
      );
    } catch (error) {
      this.logger.error(
        `Agent error for contact ${contactId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      // Do NOT throw — webhook must still return 200
    }
  }

  /**
   * Send reply via the correct channel.
   */
  private async sendReply(
    contact: any,
    config: any,
    text: string,
  ): Promise<void> {
    if (contact.channel === 'whatsapp') {
      if (!config.whatsapp_phone_id || !config.whatsapp_token) {
        this.logger.warn('WhatsApp not configured, skipping send');
        return;
      }
      await this.whatsappService.sendMessage(
        config.whatsapp_phone_id,
        config.whatsapp_token,
        contact.phone,
        text,
      );
    } else if (contact.channel === 'telegram') {
      if (!config.telegram_bot_token) {
        this.logger.warn('Telegram not configured, skipping send');
        return;
      }
      await this.telegramService.sendMessage(
        config.telegram_bot_token,
        contact.telegram_chat_id,
        text,
        contact.telegram_business_connection_id,
      );
    }
  }
}
