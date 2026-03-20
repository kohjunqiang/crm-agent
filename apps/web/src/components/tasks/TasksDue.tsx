'use client';

import { useState } from 'react';
import type { Task, Contact, CreateTaskInput } from '@agent-crm/shared';
import { toast } from 'sonner';
import { createTask, updateTask } from '@/app/actions/tasks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, AlertCircle } from 'lucide-react';

function isOverdue(task: Task): boolean {
  if (task.status === 'done' || !task.due_date) return false;
  return new Date(task.due_date) < new Date();
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'No date';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getContactName(contacts: Contact[], contactId: string | null): string | null {
  if (!contactId) return null;
  const c = contacts.find((c) => c.id === contactId);
  if (!c) return null;
  return c.name || c.phone || null;
}

interface TasksDueProps {
  initialTasks: Task[];
  contacts: Contact[];
}

export function TasksDue({ initialTasks, contacts }: TasksDueProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('');
  const [pending, setPending] = useState(false);

  // Sort: overdue first, then by due date, done at bottom
  const sorted = [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'done' ? 1 : -1;
    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const handleToggle = async (id: string, done: boolean) => {
    const status = done ? 'done' as const : 'pending' as const;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await updateTask(id, { status });
    } catch {
      toast.error('Failed to update task.');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setPending(true);
    try {
      const task = await createTask({
        title: newTitle.trim(),
        due_date: newDue || null,
      });
      setTasks((prev) => [...prev, task]);
      setNewTitle('');
      setNewDue('');
      setAdding(false);
      toast.success('Task created.');
    } catch {
      toast.error('Failed to create task.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="flex-1 gap-0 py-0 shadow-none">
      <CardHeader className="px-5 pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Tasks Due</CardTitle>
          {!adding && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-3 w-3" />
              New Task
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-5 pb-4">
        {/* Add form */}
        {adding && (
          <form onSubmit={handleAdd} className="mb-2 flex flex-col gap-2 rounded-md border p-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title"
              className="h-7 text-xs"
              autoFocus
              required
            />
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="h-7 flex-1 text-xs"
              />
              <Button type="submit" size="sm" className="h-7 px-2 text-xs" disabled={pending || !newTitle.trim()}>
                Add
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Task list */}
        {sorted.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No tasks yet.
          </p>
        ) : (
          sorted.slice(0, 8).map((task) => {
            const overdue = isOverdue(task);
            const contactName = getContactName(contacts, task.contact_id);

            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5',
                  overdue && 'bg-red-50/50',
                )}
              >
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={(e) => handleToggle(task.id, e.target.checked)}
                  className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded accent-primary"
                />
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-xs',
                    task.status === 'done' && 'text-muted-foreground line-through',
                  )}
                >
                  {task.title}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {overdue && <AlertCircle className="h-3 w-3 text-red-500" />}
                  <span
                    className={cn(
                      'text-[10px]',
                      overdue ? 'font-medium text-red-500' : 'text-muted-foreground',
                    )}
                  >
                    {formatDueDate(task.due_date)}
                  </span>
                  {contactName && (
                    <span className="text-[10px] text-muted-foreground">
                      · {contactName}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
