'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Contact, Activity } from '@agent-crm/shared';
import { toast } from 'sonner';
import { updateContact } from '@/app/actions/contacts';
import { getActivities } from '@/app/actions/activities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatEventType } from '@/lib/format';
import {
  Tag,
  X,
  Plus,
  Bot,
  User,
  Activity as ActivityIcon,
  Info,
  UserCircle,
  Pencil,
  Check,
} from 'lucide-react';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function actorColor(actor: string): string {
  switch (actor) {
    case 'agent':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'human':
      return 'border-gray-200 bg-gray-50 text-gray-600';
    default:
      return 'border-blue-200 bg-blue-50 text-blue-700';
  }
}

// ----------------------------------------------------------------
// InlineEditField
// ----------------------------------------------------------------
interface InlineEditFieldProps {
  label: string;
  value: string | null | undefined;
  placeholder: string;
  onSave: (value: string | null) => Promise<void>;
  multiline?: boolean;
}

function InlineEditField({ label, value, placeholder, onSave, multiline }: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [pending, setPending] = useState(false);

  const handleEdit = () => {
    setDraft(value ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    const newValue = trimmed || null;
    if (newValue === (value ?? null)) {
      setEditing(false);
      return;
    }
    setPending(true);
    try {
      await onSave(newValue);
      setEditing(false);
    } catch {
      toast.error(`Failed to update ${label.toLowerCase()}.`);
    } finally {
      setPending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          className="h-7 flex-1 text-xs"
          autoFocus
          disabled={pending}
        />
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1.5">
      <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={cn('flex-1 text-xs', value ? '' : 'text-muted-foreground')}>
        {value || placeholder}
      </span>
      <button
        type="button"
        onClick={handleEdit}
        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        aria-label={`Edit ${label}`}
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// TagEditor
// ----------------------------------------------------------------
interface TagEditorProps {
  tags: string[];
  onSave: (tags: string[]) => Promise<void>;
}

function TagEditor({ tags, onSave }: TagEditorProps) {
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);

  const addTag = async () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) {
      setInput('');
      return;
    }
    setPending(true);
    try {
      await onSave([...tags, trimmed]);
      setInput('');
    } catch {
      toast.error('Failed to add tag.');
    } finally {
      setPending(false);
    }
  };

  const removeTag = async (tag: string) => {
    setPending(true);
    try {
      await onSave(tags.filter((t) => t !== tag));
    } catch {
      toast.error('Failed to remove tag.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
          >
            <Tag className="h-2.5 w-2.5" />
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={pending}
              className="ml-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}
      </div>
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Add tag…"
          className="h-7 text-xs"
          disabled={pending}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={addTag}
          disabled={pending || !input.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// ContextField
// ----------------------------------------------------------------
function ContextField({
  label,
  value,
}: {
  label: string;
  value: string | string[] | undefined;
}) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {Array.isArray(value) ? (
        <ul className="flex flex-col gap-0.5">
          {value.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs leading-relaxed">{value}</p>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// ActivityTimeline
// ----------------------------------------------------------------
interface ActivityTimelineProps {
  activities: Activity[];
}

function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-2.5">
          {/* Timeline dot */}
          <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
            {activity.actor === 'agent' ? (
              <Bot className="h-3 w-3 text-violet-600" />
            ) : (
              <User className="h-3 w-3 text-gray-500" />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">
                {formatEventType(activity.event_type)}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {formatRelativeTime(activity.created_at)}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {activity.entity_type}
              {activity.actor !== 'system' && (
                <Badge
                  variant="outline"
                  className={cn(
                    'ml-1.5 px-1 py-0 text-[9px]',
                    actorColor(activity.actor),
                  )}
                >
                  {activity.actor}
                </Badge>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------
// ContactDetails
// ----------------------------------------------------------------
interface ContactDetailsProps {
  contact: Contact;
  onUpdated?: (contact: Contact) => void;
}

export function ContactDetails({ contact, onUpdated }: ContactDetailsProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const data = await getActivities(contact.id);
      setActivities(data);
    } catch {
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }, [contact.id]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleTagSave = useCallback(
    async (tags: string[]) => {
      const updated = await updateContact(contact.id, { tags });
      onUpdated?.(updated);
    },
    [contact.id, onUpdated],
  );

  const handleFieldSave = useCallback(
    async (field: string, value: string | null) => {
      const updated = await updateContact(contact.id, { [field]: value });
      onUpdated?.(updated);
    },
    [contact.id, onUpdated],
  );

  const hasContext =
    contact.context.needs ||
    contact.context.budget ||
    contact.context.timeline ||
    (contact.context.objections?.length ?? 0) > 0 ||
    (contact.context.preferences?.length ?? 0) > 0 ||
    contact.context.summary;

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Status</span>
        <Badge variant="secondary" className="text-xs capitalize">
          {contact.status}
        </Badge>
        {contact.channel && (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              contact.channel === 'whatsapp'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-blue-200 bg-blue-50 text-blue-700',
            )}
          >
            {contact.channel === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
          </Badge>
        )}
      </div>

      <Separator />

      {/* Contact Info */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Contact Info</span>
        </div>
        <div className="flex flex-col gap-2">
          <InlineEditField
            label="Name"
            value={contact.name}
            placeholder="Add name…"
            onSave={(v) => handleFieldSave('name', v)}
          />
          <InlineEditField
            label="Phone"
            value={contact.phone}
            placeholder="Add phone…"
            onSave={(v) => handleFieldSave('phone', v)}
          />
          <InlineEditField
            label="Email"
            value={contact.email}
            placeholder="Add email…"
            onSave={(v) => handleFieldSave('email', v)}
          />
          <InlineEditField
            label="Company"
            value={contact.company}
            placeholder="Add company…"
            onSave={(v) => handleFieldSave('company', v)}
          />
          <InlineEditField
            label="Address"
            value={contact.address}
            placeholder="Add address…"
            onSave={(v) => handleFieldSave('address', v)}
          />
        </div>
      </div>

      <Separator />

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Tags</span>
        </div>
        <TagEditor tags={contact.tags ?? []} onSave={handleTagSave} />
      </div>

      <Separator />

      {/* Context */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Context</span>
        </div>

        {hasContext ? (
          <div className="flex flex-col gap-3">
            <ContextField label="Summary" value={contact.context.summary} />
            <ContextField label="Needs" value={contact.context.needs} />
            <ContextField label="Budget" value={contact.context.budget} />
            <ContextField label="Timeline" value={contact.context.timeline} />
            <ContextField label="Objections" value={contact.context.objections} />
            <ContextField label="Preferences" value={contact.context.preferences} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No context collected yet. The agent will populate this as it learns more.
          </p>
        )}
      </div>

      <Separator />

      {/* Activity timeline */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Activity</span>
        </div>
        {activitiesLoading ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            Loading…
          </p>
        ) : (
          <ActivityTimeline activities={activities} />
        )}
      </div>
    </div>
  );
}
