import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { ContactsService } from '../contacts/contacts.service';

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private readonly knowledgeService: KnowledgeService,
    private readonly contactsService: ContactsService,
  ) {}

  /**
   * Execute a tool call from Claude and return the result as a string.
   * Claude will use this result to craft its final reply.
   */
  async execute(
    toolName: string,
    toolInput: Record<string, any>,
    userId: string,
    contactId: string,
  ): Promise<string> {
    this.logger.log(
      `Executing tool: ${toolName} with input: ${JSON.stringify(toolInput)}`,
    );

    switch (toolName) {
      case 'search_knowledge_base':
        return this.searchKnowledgeBase(userId, toolInput.query);
      case 'update_contact_status':
        return this.updateContactStatus(
          userId,
          contactId,
          toolInput.status,
          toolInput.reason,
        );
      case 'escalate_to_human':
        return this.escalateToHuman(userId, contactId, toolInput.reason);
      default:
        this.logger.warn(`Unknown tool: ${toolName}`);
        return `Unknown tool: ${toolName}`;
    }
  }

  private async searchKnowledgeBase(
    userId: string,
    query: string,
  ): Promise<string> {
    const entries = await this.knowledgeService.searchEntries(userId, query);
    if (entries.length === 0) {
      return 'No matching knowledge base entries found for this query.';
    }
    return entries.map((e) => `## ${e.title}\n${e.content}`).join('\n\n');
  }

  private async updateContactStatus(
    userId: string,
    contactId: string,
    status: string,
    reason: string,
  ): Promise<string> {
    await this.contactsService.updateContact(userId, contactId, {
      status: status as any,
    });
    this.logger.log(`Status updated to ${status}. Reason: ${reason}`);
    return `Contact status updated to "${status}". Reason: ${reason}`;
  }

  private async escalateToHuman(
    userId: string,
    contactId: string,
    reason: string,
  ): Promise<string> {
    await this.contactsService.updateContact(userId, contactId, {
      agent_enabled: false,
    });
    this.logger.log(`Escalated to human. Reason: ${reason}`);
    return `Conversation escalated to human. AI agent has been paused. Reason: ${reason}`;
  }
}
