'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getAgentConfig, updateAgentConfig } from '@/lib/api';
import { toast } from 'sonner';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';

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

function HelpTip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs text-left">
        {children}
      </TooltipContent>
    </Tooltip>
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

  // Track saved state for status indicators
  const [savedWa, setSavedWa] = useState({ phoneId: '', token: '', verifyToken: '' });
  const [savedTgToken, setSavedTgToken] = useState('');
  const [tgBusinessConnectionId, setTgBusinessConnectionId] = useState<string | null>(null);

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
        setTgBusinessConnectionId(c.telegram_business_connection_id ?? null);
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
      const result = await updateAgentConfig({ telegram_bot_token: tgBotToken });
      setSavedTgToken(tgBotToken);

      if (!tgBotToken) {
        toast.success('Telegram disconnected');
      } else if (result.telegram_webhook?.set) {
        toast.success('Telegram connected — webhook configured');
      } else if (result.telegram_webhook && !result.telegram_webhook.set) {
        toast.warning('Token saved but webhook setup failed. Check your API_BASE_URL.');
      } else {
        toast.success('Telegram token saved');
      }
    } catch {
      toast.error('Failed to save Telegram configuration');
    } finally {
      setTgSaving(false);
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
    <TooltipProvider delayDuration={300}>
      <div className="space-y-8">
        {/* WhatsApp */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">WhatsApp</h3>
              <HelpTip>
                <p className="font-medium mb-1">WhatsApp Setup</p>
                <ol className="list-decimal pl-3.5 space-y-1">
                  <li>Go to Meta Business Platform</li>
                  <li>Navigate to WhatsApp &gt; API Setup</li>
                  <li>Copy your Phone Number ID and generate an Access Token</li>
                  <li>Create a Verify Token (any string you choose)</li>
                  <li>
                    Set the webhook URL in Meta to:{' '}
                    <span className="font-mono text-[10px]">
                      {'<your-api-url>'}
                      /webhooks/whatsapp
                    </span>
                  </li>
                </ol>
              </HelpTip>
            </div>
            <StatusDot connected={waConnected} />
          </div>
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
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Telegram</h3>
              <HelpTip>
                <p className="font-medium mb-1">Telegram Setup</p>
                <ol className="list-decimal pl-3.5 space-y-1">
                  <li>
                    Message{' '}
                    <span className="font-semibold">@BotFather</span> on Telegram
                  </li>
                  <li>Send /newbot and follow the prompts</li>
                  <li>Copy the bot token and paste it here, then click Save &amp; Connect</li>
                  <li>
                    <span className="font-medium">For Business:</span> in @BotFather,
                    send /mybots → select your bot → Bot Settings → enable{' '}
                    <span className="font-semibold">Business Mode</span>
                  </li>
                  <li>
                    In Telegram, go to Settings → Telegram Business → Chatbots
                  </li>
                  <li>
                    Enter your bot username (e.g.{' '}
                    <span className="font-mono text-[10px]">@YourBotName</span>
                    ) and URL{' '}
                    <span className="font-mono text-[10px]">
                      https://t.me/YourBotName
                    </span>
                  </li>
                  <li>Save in Telegram — the status below will update to &quot;Business account connected&quot;</li>
                </ol>
              </HelpTip>
            </div>
            <StatusDot connected={tgConnected} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tg-bot-token">Bot Token</Label>
            <PasswordInput
              id="tg-bot-token"
              value={tgBotToken}
              onChange={setTgBotToken}
              placeholder="123456:ABC-DEF..."
            />
          </div>
          {savedTgToken && (
            <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
              tgBusinessConnectionId
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                : 'border-muted bg-muted/50 text-muted-foreground'
            }`}>
              <span className={`inline-block h-2 w-2 rounded-full ${
                tgBusinessConnectionId ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              {tgBusinessConnectionId ? (
                <span>Business account connected — replies will be sent on behalf of your business</span>
              ) : (
                <span>
                  Personal bot mode — to reply as your business, add this bot in{' '}
                  <span className="font-medium">Telegram → Settings → Telegram Business → Chatbots</span>
                  {' '}using your bot username
                </span>
              )}
            </div>
          )}
          <Button onClick={handleTgSave} disabled={tgSaving}>
            {tgSaving ? 'Connecting...' : 'Save & Connect'}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
