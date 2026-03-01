import { Generated } from 'kysely';

export interface Database {
  contacts: ContactsTable;
  messages: MessagesTable;
  knowledge_base: KnowledgeBaseTable;
  agent_config: AgentConfigTable;
}

export interface ContactsTable {
  id: Generated<string>;
  user_id: string;
  name: string | null;
  phone: string | null;
  telegram_chat_id: string | null;
  channel: 'whatsapp' | 'telegram';
  status: 'new' | 'engaged' | 'qualified' | 'converted';
  agent_enabled: Generated<boolean>;
  last_message_at: string | null;
  last_message_preview: string | null;
  metadata: Generated<Record<string, any>>;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface MessagesTable {
  id: Generated<string>;
  contact_id: string;
  user_id: string;
  direction: 'inbound' | 'outbound';
  sender: 'lead' | 'agent' | 'human';
  channel: 'whatsapp' | 'telegram';
  content: string;
  external_id: string | null;
  created_at: Generated<string>;
}

export interface KnowledgeBaseTable {
  id: Generated<string>;
  user_id: string;
  title: string;
  content: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface AgentConfigTable {
  id: Generated<string>;
  user_id: string;
  system_prompt: Generated<string>;
  whatsapp_phone_id: string | null;
  whatsapp_token: string | null;
  whatsapp_verify_token: string | null;
  telegram_bot_token: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}
