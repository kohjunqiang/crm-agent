import { Injectable } from '@nestjs/common';
import type { Message } from '@agent-crm/shared';
import { AGENT_TOOLS } from './tools';

@Injectable()
export class PromptService {
  /**
   * Build the system prompt for the agent.
   * NOTE: The knowledge base is NOT included here.
   * The agent will use the search_knowledge_base tool to find relevant info.
   */
  buildSystemPrompt(customPrompt: string, channel: string): string {
    return `${customPrompt}

ROLE:
You are an AI sales assistant responding to leads via ${channel}. You have access to tools that let you search for business information, update the CRM, and escalate to a human when needed.

RULES:
- ALWAYS use the search_knowledge_base tool before answering product/service/pricing questions. Do not guess.
- Reply naturally, concisely (2-4 sentences), and helpfully based on the tool results.
- If the knowledge base search returns no results, say you don't have that information and suggest contacting the business directly.
- Never make up information that didn't come from a tool result.
- Match the lead's language if they write in a non-English language.
- Do not reveal you are an AI unless directly asked.
- Use update_contact_status when you notice clear progression in buying intent.
- Use escalate_to_human when the lead is frustrated, requests a human, or the topic is beyond your scope.`;
  }

  /**
   * Build the messages array from conversation history.
   * Takes last 20 messages and maps sender types to roles.
   */
  buildMessages(
    conversationHistory: Message[],
    inboundMessage: string,
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const recent = conversationHistory.slice(-20);

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of recent) {
      if (msg.sender === 'lead') {
        messages.push({ role: 'user', content: msg.content });
      } else {
        // 'agent' and 'human' replies are both assistant messages
        messages.push({ role: 'assistant', content: msg.content });
      }
    }

    // Add the new inbound message
    messages.push({ role: 'user', content: inboundMessage });

    return messages;
  }

  /**
   * Get the tool definitions for the Claude API call.
   */
  getTools() {
    return AGENT_TOOLS;
  }
}
