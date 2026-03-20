import { Generated } from 'kysely';

export interface Database {
  contacts: ContactsTable;
  messages: MessagesTable;
  knowledge_base: KnowledgeBaseTable;
  agent_config: AgentConfigTable;
  deals: DealsTable;
  payments: PaymentsTable;
  tasks: TasksTable;
  notes: NotesTable;
  activities: ActivitiesTable;
  quotations: QuotationsTable;
  invoices: InvoicesTable;
  receipts: ReceiptsTable;
  document_sequences: DocumentSequencesTable;
}

export interface ContactsTable {
  id: Generated<string>;
  user_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  company: string | null;
  telegram_chat_id: string | null;
  telegram_business_connection_id: string | null;
  channel: 'whatsapp' | 'telegram';
  status: 'new' | 'engaged' | 'qualified' | 'converted';
  agent_enabled: Generated<boolean>;
  last_message_at: string | null;
  last_message_preview: string | null;
  metadata: Generated<Record<string, any>>;
  context: Generated<Record<string, any>>;
  tags: Generated<string[]>;
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
  telegram_business_connection_id: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

type DealStageValue =
  | 'discovery'
  | 'consultation'
  | 'quotation_sent'
  | 'confirmed'
  | 'ordered'
  | 'fulfilled'
  | 'completed'
  | 'lost';

export interface DealsTable {
  id: Generated<string>;
  contact_id: string;
  user_id: string;
  title: string;
  amount: number | null;
  currency: Generated<string>;
  stage: Generated<DealStageValue>;
  expected_close_date: string | null;
  products: Generated<Record<string, any>[]>;
  notes: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface PaymentsTable {
  id: Generated<string>;
  deal_id: string;
  user_id: string;
  amount: number;
  label: string | null;
  paid_at: string | null;
  receipt_issued_at: string | null;
  created_at: Generated<string>;
}

export interface TasksTable {
  id: Generated<string>;
  contact_id: string | null;
  deal_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: Generated<'pending' | 'done'>;
  created_by: Generated<'human' | 'agent'>;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export interface NotesTable {
  id: Generated<string>;
  contact_id: string;
  user_id: string;
  content: string;
  author: Generated<'human' | 'agent'>;
  created_at: Generated<string>;
}

export interface ActivitiesTable {
  id: Generated<string>;
  user_id: string;
  contact_id: string | null;
  entity_type: string;
  entity_id: string | null;
  event_type: string;
  actor: Generated<'human' | 'agent' | 'system'>;
  metadata: Generated<Record<string, any>>;
  created_at: Generated<string>;
}

export interface QuotationsTable {
  id: Generated<string>;
  deal_id: string;
  user_id: string;
  quotation_number: string;
  items: Generated<Record<string, any>[]>;
  subtotal: number;
  gst_rate: Generated<number>;
  gst_amount: number;
  total: number;
  terms: string | null;
  validity_days: Generated<number | null>;
  status: Generated<string>;
  pdf_path: string | null;
  created_at: Generated<string>;
}

export interface InvoicesTable {
  id: Generated<string>;
  deal_id: string;
  user_id: string;
  invoice_number: string;
  items: Generated<Record<string, any>[]>;
  amount: number;
  gst_rate: Generated<number>;
  gst_amount: number;
  total: number;
  due_date: string | null;
  payment_terms: string | null;
  status: Generated<string>;
  pdf_path: string | null;
  created_at: Generated<string>;
}

export interface ReceiptsTable {
  id: Generated<string>;
  payment_id: string;
  user_id: string;
  receipt_number: string;
  amount: number;
  pdf_path: string | null;
  created_at: Generated<string>;
}

export interface DocumentSequencesTable {
  id: Generated<string>;
  user_id: string;
  type: string;
  last_number: Generated<number>;
}
