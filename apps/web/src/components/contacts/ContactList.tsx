'use client';

import { useState } from 'react';
import type { Contact } from '@agent-crm/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContactCard } from './ContactCard';
import { Search, Plus } from 'lucide-react';
import { getDisplayName } from '@/lib/format';

interface ContactListProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  dealValues?: Map<string, number>;
}

function sortByRecent(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function ContactList({ contacts, selectedId, onSelect, dealValues }: ContactListProps) {
  const [search, setSearch] = useState('');

  const searched = search.trim()
    ? contacts.filter((c) => {
        const q = search.toLowerCase();
        const name = getDisplayName(c).toLowerCase();
        const phone = (c.phone ?? '').toLowerCase();
        const tags = (c.tags ?? []).join(' ').toLowerCase();
        return name.includes(q) || phone.includes(q) || tags.includes(q);
      })
    : contacts;

  const sorted = sortByRecent(searched);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Button size="sm" className="h-8 shrink-0 gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 px-2 pb-2">
          {sorted.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {contacts.length === 0
                ? 'No clients yet. Leads will appear when they message you.'
                : 'No clients match.'}
            </p>
          ) : (
            sorted.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                isSelected={selectedId === contact.id}
                onClick={() => onSelect(contact.id)}
                dealValue={dealValues?.get(contact.id) ?? null}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
