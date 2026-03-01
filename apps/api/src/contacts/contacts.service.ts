import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Contact } from '@agent-crm/shared';

@Injectable()
export class ContactsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listContacts(userId: string): Promise<Contact[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data as Contact[];
  }

  async getContact(userId: string, contactId: string): Promise<Contact> {
    const { data, error } = await this.supabase
      .getClient()
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Contact ${contactId} not found`);
    }
    return data as Contact;
  }

  async updateContact(
    userId: string,
    contactId: string,
    updates: { status?: string; agent_enabled?: boolean; name?: string },
  ): Promise<Contact> {
    const { data, error } = await this.supabase
      .getClient()
      .from('contacts')
      .update(updates)
      .eq('id', contactId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Contact ${contactId} not found`);
    }
    return data as Contact;
  }

  async findOrCreateContact(
    userId: string,
    params: {
      phone?: string;
      telegram_chat_id?: string;
      channel: string;
      name?: string;
    },
  ): Promise<Contact> {
    const client = this.supabase.getClient();

    // Look up existing contact
    let query = client.from('contacts').select('*').eq('user_id', userId);

    if (params.phone) {
      query = query.eq('phone', params.phone);
    } else if (params.telegram_chat_id) {
      query = query.eq('telegram_chat_id', params.telegram_chat_id);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      // Update name if provided and current name is null
      if (params.name && !existing.name) {
        const { data: updated } = await client
          .from('contacts')
          .update({ name: params.name })
          .eq('id', existing.id)
          .eq('user_id', userId)
          .select()
          .single();
        return (updated ?? existing) as Contact;
      }
      return existing as Contact;
    }

    // Insert new contact
    const { data: created, error } = await client
      .from('contacts')
      .insert({
        user_id: userId,
        phone: params.phone ?? null,
        telegram_chat_id: params.telegram_chat_id ?? null,
        channel: params.channel,
        name: params.name ?? null,
        status: 'new',
        agent_enabled: true,
      })
      .select()
      .single();

    if (error || !created) throw error;
    return created as Contact;
  }

  async updateLastMessage(contactId: string, preview: string): Promise<void> {
    await this.supabase
      .getClient()
      .from('contacts')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: preview.slice(0, 100),
      })
      .eq('id', contactId);
  }
}
