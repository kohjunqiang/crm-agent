import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { KnowledgeBaseEntry } from '@agent-crm/shared';

@Injectable()
export class KnowledgeService {
  constructor(private readonly supabase: SupabaseService) {}

  async getEntries(userId: string): Promise<KnowledgeBaseEntry[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('knowledge_base')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as KnowledgeBaseEntry[];
  }

  async getEntry(userId: string, id: string): Promise<KnowledgeBaseEntry> {
    const { data, error } = await this.supabase
      .getClient()
      .from('knowledge_base')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Knowledge base entry ${id} not found`);
    }
    return data as KnowledgeBaseEntry;
  }

  async createEntry(
    userId: string,
    data: { title: string; content: string },
  ): Promise<KnowledgeBaseEntry> {
    const { data: created, error } = await this.supabase
      .getClient()
      .from('knowledge_base')
      .insert({ user_id: userId, title: data.title, content: data.content })
      .select()
      .single();

    if (error || !created) throw error;
    return created as KnowledgeBaseEntry;
  }

  async updateEntry(
    userId: string,
    id: string,
    data: { title?: string; content?: string },
  ): Promise<KnowledgeBaseEntry> {
    const { data: updated, error } = await this.supabase
      .getClient()
      .from('knowledge_base')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !updated) {
      throw new NotFoundException(`Knowledge base entry ${id} not found`);
    }
    return updated as KnowledgeBaseEntry;
  }

  async deleteEntry(userId: string, id: string): Promise<void> {
    await this.supabase
      .getClient()
      .from('knowledge_base')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
  }

  async searchEntries(
    userId: string,
    query: string,
  ): Promise<KnowledgeBaseEntry[]> {
    const entries = await this.getEntries(userId);
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);

    if (words.length === 0) return [];

    const scored = entries
      .map((entry) => {
        const title = entry.title.toLowerCase();
        const content = entry.content.toLowerCase();
        const score = words.filter(
          (word) => title.includes(word) || content.includes(word),
        ).length;
        return { entry, score };
      })
      .filter(({ score }) => score > 0);

    scored.sort((a, b) => b.score - a.score);

    return scored.map(({ entry }) => entry);
  }

  async getAllContent(userId: string): Promise<string> {
    const entries = await this.getEntries(userId);
    return entries.map((e) => `## ${e.title}\n${e.content}`).join('\n\n');
  }
}
