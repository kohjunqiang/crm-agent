'use client';

import { useState, useMemo } from 'react';
import type { Activity, Contact } from '@agent-crm/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Bot, User } from 'lucide-react';
import { formatEventType } from '@/lib/format';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_COLORS: Record<string, string> = {
  created: 'bg-emerald-400',
  updated: 'bg-blue-400',
  stage_changed: 'bg-amber-400',
  message_sent: 'bg-violet-400',
  message_received: 'bg-violet-400',
  payment_received: 'bg-green-500',
};

function getEventColor(eventType: string): string {
  return EVENT_COLORS[eventType] ?? 'bg-muted-foreground';
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getCalendarGrid(year: number, month: number): (Date | null)[] {
  const days = getDaysInMonth(year, month);
  const firstDayOfWeek = days[0].getDay();
  const grid: (Date | null)[] = [];

  // Leading blanks
  for (let i = 0; i < firstDayOfWeek; i++) {
    grid.push(null);
  }
  for (const d of days) {
    grid.push(d);
  }
  // Trailing blanks to fill last row
  while (grid.length % 7 !== 0) {
    grid.push(null);
  }
  return grid;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function ActivityCalendar({
  activities,
  contacts,
}: {
  activities: Activity[];
  contacts: Contact[];
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activityMap = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities) {
      const d = new Date(a.created_at);
      const key = dateKey(d);
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [activities]);

  const contactMap = useMemo(() => {
    const map = new Map<string, Contact>();
    for (const c of contacts) map.set(c.id, c);
    return map;
  }, [contacts]);

  const grid = getCalendarGrid(currentMonth.year, currentMonth.month);
  const today = new Date();
  const todayKey = dateKey(today);
  const monthLabel = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function prevMonth() {
    setCurrentMonth((prev) => {
      const d = new Date(prev.year, prev.month - 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentMonth((prev) => {
      const d = new Date(prev.year, prev.month + 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelectedDate(null);
  }

  const selectedActivities = selectedDate ? activityMap.get(selectedDate) ?? [] : [];

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-4">
        <CardTitle className="text-sm font-semibold">Activity Calendar</CardTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-md p-2 hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center text-xs font-medium">
            {monthLabel}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-md p-2 hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px">
          {DAYS.map((day) => (
            <div
              key={day}
              className="pb-2 text-center text-[10px] font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px">
          {grid.map((date, i) => {
            if (!date) {
              return <div key={`blank-${i}`} className="h-16 rounded-md" />;
            }
            const key = dateKey(date);
            const dayActivities = activityMap.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                className={`flex h-16 flex-col items-start rounded-md p-1.5 text-left transition-colors hover:bg-accent ${
                  isSelected ? 'bg-accent' : ''
                } ${isToday ? 'ring-1 ring-primary' : ''}`}
              >
                <span
                  className={`text-[11px] ${
                    isToday
                      ? 'font-bold text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayActivities.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-0.5">
                    {dayActivities.slice(0, 4).map((a) => (
                      <span
                        key={a.id}
                        className={`h-1.5 w-1.5 rounded-full ${getEventColor(a.event_type)}`}
                        title={formatEventType(a.event_type)}
                      />
                    ))}
                    {dayActivities.length > 4 && (
                      <span className="text-[8px] text-muted-foreground">
                        +{dayActivities.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day detail */}
        {selectedDate && selectedActivities.length > 0 && (
          <div className="mt-3 rounded-md border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {selectedActivities.length} activit{selectedActivities.length === 1 ? 'y' : 'ies'}
            </p>
            <div className="flex flex-col gap-1.5">
              {selectedActivities.map((a) => {
                const contact = a.contact_id ? contactMap.get(a.contact_id) : null;
                const contactName = contact
                  ? contact.name || contact.phone || 'Unknown'
                  : null;
                return (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${getEventColor(a.event_type)}`}
                    />
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted">
                      {a.actor === 'agent' ? (
                        <Bot className="h-2.5 w-2.5 text-violet-600" />
                      ) : (
                        <User className="h-2.5 w-2.5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-medium">
                      {formatEventType(a.event_type)}
                    </span>
                    {contactName && (
                      <span className="text-muted-foreground">
                        {contactName}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
