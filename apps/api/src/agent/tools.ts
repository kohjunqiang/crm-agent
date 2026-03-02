// These are the tool definitions sent to Claude's API.
// Claude reads these and DECIDES which to call based on the conversation.
// They follow the Anthropic tool_use schema exactly.

export const AGENT_TOOLS = [
  {
    name: 'search_knowledge_base',
    description:
      "Search the business knowledge base for relevant information to answer the lead's question. Use this tool whenever the lead asks about products, services, pricing, policies, FAQs, or anything business-specific. You can call this multiple times with different queries if needed.",
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Search keywords to find relevant knowledge base entries. Use specific terms related to what the lead is asking about. Examples: "pricing", "return policy", "delivery times", "product features"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'update_contact_status',
    description:
      "Update the lead's status in the CRM pipeline. Use this when the conversation clearly indicates the lead has progressed. Guidelines: Use \"engaged\" when the lead is actively asking questions or showing interest. Use \"qualified\" when the lead has expressed clear buying intent, asked about pricing specifics, or discussed their needs in detail. Use \"converted\" only when a deal is explicitly confirmed.",
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['engaged', 'qualified', 'converted'],
          description: 'The new status for this lead',
        },
        reason: {
          type: 'string',
          description: 'Brief reason for the status change (for audit trail)',
        },
      },
      required: ['status', 'reason'],
    },
  },
  {
    name: 'escalate_to_human',
    description:
      'Flag this conversation for immediate human review and pause the AI agent. Use this when: (1) the lead explicitly asks to speak with a human, (2) the lead is frustrated or upset, (3) the conversation involves sensitive topics like complaints or legal issues, (4) you genuinely cannot help with what they are asking, or (5) the lead wants to negotiate or discuss custom terms.',
    input_schema: {
      type: 'object' as const,
      properties: {
        reason: {
          type: 'string',
          description: 'Why this conversation needs human attention',
        },
      },
      required: ['reason'],
    },
  },
];

export type ToolName = (typeof AGENT_TOOLS)[number]['name'];
