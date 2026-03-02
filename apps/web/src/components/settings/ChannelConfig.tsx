'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAgentConfig, updateAgentConfig, setTelegramWebhook } from '@/lib/api';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          connected ? 'bg-green-500' : 'bg-gray-300'
        }`}
      />
      {connected ? 'Connected' : 'Not configured'}
    </span>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function ChannelConfig() {
  const [loading, setLoading] = useState(true);

  // WhatsApp fields
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waToken, setWaToken] = useState('');
  const [waVerifyToken, setWaVerifyToken] = useState('');
  const [waSaving, setWaSaving] = useState(false);

  // Telegram fields
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgSaving, setTgSaving] = useState(false);
  const [tgWebhookLoading, setTgWebhookLoading] = useState(false);

  // Track saved state for status indicators
  const [savedWa, setSavedWa] = useState({ phoneId: '', token: '', verifyToken: '' });
  const [savedTgToken, setSavedTgToken] = useState('');

  useEffect(() => {
    getAgentConfig()
      .then((data) => {
        const c = data.config;
        setWaPhoneId(c.whatsapp_phone_id ?? '');
        setWaToken(c.whatsapp_token ?? '');
        setWaVerifyToken(c.whatsapp_verify_token ?? '');
        setTgBotToken(c.telegram_bot_token ?? '');
        setSavedWa({
          phoneId: c.whatsapp_phone_id ?? '',
          token: c.whatsapp_token ?? '',
          verifyToken: c.whatsapp_verify_token ?? '',
        });
        setSavedTgToken(c.telegram_bot_token ?? '');
      })
      .catch(() => toast.error('Failed to load channel config'))
      .finally(() => setLoading(false));
  }, []);

  const waConnected = !!(savedWa.phoneId && savedWa.token && savedWa.verifyToken);
  const tgConnected = !!savedTgToken;

  async function handleWaSave() {
    setWaSaving(true);
    try {
      await updateAgentConfig({
        whatsapp_phone_id: waPhoneId,
        whatsapp_token: waToken,
        whatsapp_verify_token: waVerifyToken,
      });
      setSavedWa({ phoneId: waPhoneId, token: waToken, verifyToken: waVerifyToken });
      toast.success('WhatsApp configuration saved');
    } catch {
      toast.error('Failed to save WhatsApp configuration');
    } finally {
      setWaSaving(false);
    }
  }

  async function handleTgSave() {
    setTgSaving(true);
    try {
      await updateAgentConfig({ telegram_bot_token: tgBotToken });
      setSavedTgToken(tgBotToken);
      toast.success('Telegram configuration saved');
    } catch {
      toast.error('Failed to save Telegram configuration');
    } finally {
      setTgSaving(false);
    }
  }

  async function handleSetWebhook() {
    setTgWebhookLoading(true);
    try {
      const result = await setTelegramWebhook();
      if (result.success) {
        toast.success(`Webhook set: ${result.webhook_url}`);
      } else {
        toast.error('Failed to set webhook');
      }
    } catch {
      toast.error('Failed to set webhook');
    } finally {
      setTgWebhookLoading(false);
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
    <div className="space-y-8">
      {/* WhatsApp */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">WhatsApp</h3>
          <StatusDot connected={waConnected} />
        </div>
        <p className="text-xs text-muted-foreground">
          Get these from Meta Business Platform &gt; WhatsApp &gt; API Setup
        </p>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="wa-phone-id">Phone Number ID</Label>
            <Input
              id="wa-phone-id"
              value={waPhoneId}
              onChange={(e) => setWaPhoneId(e.target.value)}
              placeholder="e.g. 123456789012345"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-token">Access Token</Label>
            <PasswordInput
              id="wa-token"
              value={waToken}
              onChange={setWaToken}
              placeholder="EAAx..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-verify-token">Verify Token</Label>
            <Input
              id="wa-verify-token"
              value={waVerifyToken}
              onChange={(e) => setWaVerifyToken(e.target.value)}
              placeholder="Your custom verify token"
            />
          </div>
        </div>
        <Button onClick={handleWaSave} disabled={waSaving}>
          {waSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <hr />

      {/* Telegram */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Telegram</h3>
          <StatusDot connected={tgConnected} />
        </div>
        <p className="text-xs text-muted-foreground">
          Create a bot via @BotFather on Telegram
        </p>
        <div className="space-y-2">
          <Label htmlFor="tg-bot-token">Bot Token</Label>
          <PasswordInput
            id="tg-bot-token"
            value={tgBotToken}
            onChange={setTgBotToken}
            placeholder="123456:ABC-DEF..."
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTgSave} disabled={tgSaving}>
            {tgSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="outline"
            onClick={handleSetWebhook}
            disabled={!savedTgToken || tgWebhookLoading}
          >
            {tgWebhookLoading ? 'Setting...' : 'Set Webhook'}
          </Button>
        </div>
      </div>
    </div>
  );
}
