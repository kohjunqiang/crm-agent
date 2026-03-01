import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Message } from '@agent-crm/shared';

@Injectable()
export class MessagesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getMessages(contactId: string, userId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('messages')
      .select('*')
      .eq('contact_id', contactId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Message[];
  }

  async saveMessage(data: {
    contact_id: string;
    user_id: string;
    direction: string;
    sender: string;
    channel: string;
    content: string;
    external_id?: string;
  }): Promise<Message> {
    const { data: created, error } = await this.supabase
      .getClient()
      .from('messages')
      .insert(data)
      .select()
      .single();

    if (error || !created) throw error;
    return created as Message;
  }

  async existsByExternalId(externalId: string): Promise<boolean> {
    const { data } = await this.supabase
      .getClient()
      .from('messages')
      .select('id')
      .eq('external_id', externalId)
      .limit(1)
      .maybeSingle();

    return !!data;
  }
}
