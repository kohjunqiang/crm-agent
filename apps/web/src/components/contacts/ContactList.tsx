'use client';

import type { Contact, ContactStatus } from '@agent-crm/shared';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContactCard } from './ContactCard';

interface ContactListProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
];

function sortByRecent(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });
}

function countByStatus(contacts: Contact[], status: string): number {
  if (status === 'all') return contacts.length;
  return contacts.filter((c) => c.status === status).length;
}

function filterByStatus(contacts: Contact[], status: string): Contact[] {
  if (status === 'all') return contacts;
  return contacts.filter((c) => c.status === (status as ContactStatus));
}

export function ContactList({ contacts, selectedId, onSelect }: ContactListProps) {
  const sorted = sortByRecent(contacts);

  return (
    <Tabs defaultValue="all" className="flex h-full flex-col">
      <div className="px-3 pt-3">
        <TabsList className="w-full">
          {STATUS_TABS.map((tab) => {
            const count = countByStatus(sorted, tab.value);
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
                {count > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {STATUS_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0 flex-1">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-0.5 p-2">
              {filterByStatus(sorted, tab.value).length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {contacts.length === 0
                    ? 'No contacts yet. Leads will appear when they message you.'
                    : 'No contacts in this category.'}
                </p>
              ) : (
                filterByStatus(sorted, tab.value).map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedId === contact.id}
                    onClick={() => onSelect(contact.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}
