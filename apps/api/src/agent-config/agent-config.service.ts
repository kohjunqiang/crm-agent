import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { AgentConfig } from '@agent-crm/shared';

const DEFAULT_SYSTEM_PROMPT = `You are a helpful sales assistant. Answer questions about our products and services. Be friendly, professional, and concise.`;

@Injectable()
export class AgentConfigService {
  constructor(private readonly supabase: SupabaseService) {}

  async getConfig(userId: string): Promise<AgentConfig> {
    const { data, error } = await this.supabase
      .getClient()
      .from('agent_config')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (data) return data as AgentConfig;

    // Create default config
    const { data: created, error: insertError } = await this.supabase
      .getClient()
      .from('agent_config')
      .insert({
        user_id: userId,
        system_prompt: DEFAULT_SYSTEM_PROMPT,
      })
      .select()
      .single();

    if (insertError || !created) throw insertError;
    return created as AgentConfig;
  }

  async updateConfig(
    userId: string,
    data: Partial<AgentConfig>,
  ): Promise<AgentConfig> {
    // Ensure config exists first
    await this.getConfig(userId);

    const { data: updated, error } = await this.supabase
      .getClient()
      .from('agent_config')
      .update(data)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !updated) throw error;
    return updated as AgentConfig;
  }

  async getConfigByWhatsAppPhoneId(
    phoneId: string,
  ): Promise<{ config: AgentConfig; user_id: string } | null> {
    const { data, error } = await this.supabase
      .getClient()
      .from('agent_config')
      .select('*')
      .eq('whatsapp_phone_id', phoneId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return { config: data as AgentConfig, user_id: data.user_id };
  }

  async getConfigByTelegramToken(
    botToken: string,
  ): Promise<{ config: AgentConfig; user_id: string } | null> {
    const { data, error } = await this.supabase
      .getClient()
      .from('agent_config')
      .select('*')
      .eq('telegram_bot_token', botToken)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return { config: data as AgentConfig, user_id: data.user_id };
  }

  async getConfigByVerifyToken(
    verifyToken: string,
  ): Promise<AgentConfig | null> {
    const { data, error } = await this.supabase
      .getClient()
      .from('agent_config')
      .select('*')
      .eq('whatsapp_verify_token', verifyToken)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return data as AgentConfig;
  }
}
