'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Task, CreateTaskInput } from '@agent-crm/shared';
import { toast } from 'sonner';
import { getTasks, createTask, updateTask, deleteTask } from '@/app/actions/tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, Trash2, AlertCircle, CheckSquare } from 'lucide-react';

function isOverdue(task: Task): boolean {
  if (task.status === 'done' || !task.due_date) return false;
  return new Date(task.due_date) < new Date();
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'No date';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ContactTasksProps {
  contactId: string;
}

export function ContactTasks({ contactId }: ContactTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState('');
  const [pending, setPending] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTasks({ contactId });
      setTasks(data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggle = async (id: string, done: boolean) => {
    const status = done ? 'done' as const : 'pending' as const;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await updateTask(id, { status });
    } catch {
      toast.error('Failed to update task.');
      fetchTasks();
    }
  };

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTask(id);
    } catch {
      toast.error('Failed to delete task.');
      fetchTasks();
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
        contact_id: contactId,
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

  // Sort: pending first (overdue at top), then done
  const sorted = [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'done' ? 1 : -1;
    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-xs text-muted-foreground">Loading tasks…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">
            Tasks
            {tasks.length > 0 && (
              <span className="ml-1.5 text-muted-foreground">({tasks.length})</span>
            )}
          </span>
        </div>
        {!adding && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="flex flex-col gap-2 rounded-lg border p-3">
          <p className="text-xs font-semibold">New Task</p>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title"
            className="h-7 text-xs"
            autoFocus
            required
          />
          <Input
            type="date"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            className="h-7 text-xs"
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAdding(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs" disabled={pending || !newTitle.trim()}>
              {pending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      )}

      {/* Task list */}
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No tasks yet. Create one to track follow-ups.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {sorted.map((task) => {
            const overdue = isOverdue(task);
            return (
              <div
                key={task.id}
                className={cn(
                  'group flex items-center gap-2.5 rounded-md border px-3 py-2',
                  overdue && 'border-red-200 bg-red-50/50',
                )}
              >
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={(e) => handleToggle(task.id, e.target.checked)}
                  className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded accent-primary"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      'truncate text-xs font-medium',
                      task.status === 'done' && 'text-muted-foreground line-through',
                    )}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {overdue && <AlertCircle className="h-2.5 w-2.5 text-red-500" />}
                    <span
                      className={cn(
                        'text-[10px]',
                        overdue ? 'font-medium text-red-500' : 'text-muted-foreground',
                      )}
                    >
                      {formatDueDate(task.due_date)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(task.id)}
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete task"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
