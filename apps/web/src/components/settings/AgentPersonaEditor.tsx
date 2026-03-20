'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getAgentConfig, updateAgentConfig } from '@/app/actions/config';
import { toast } from 'sonner';

export function AgentPersonaEditor() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAgentConfig()
      .then((config) => setSystemPrompt(config?.system_prompt ?? ''))
      .catch(() => toast.error('Failed to load agent config'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateAgentConfig({ system_prompt: systemPrompt });
      toast.success('Agent persona saved');
    } catch {
      toast.error('Failed to save agent persona');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        This is the instruction set for your AI agent. It controls tone,
        identity, and behavior.
      </p>

      <div className="space-y-2">
        <Label htmlFor="system-prompt">System Prompt</Label>
        <Textarea
          id="system-prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={15}
          placeholder="You are a helpful customer service agent for..."
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Tips: Include your business name, what you offer, greeting style, topics
        to avoid, and when to escalate.
      </p>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
