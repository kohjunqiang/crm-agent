'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Note } from '@agent-crm/shared';
import { toast } from 'sonner';
import { getNotes, createNote, deleteNote } from '@/app/actions/notes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Bot, User, Trash2, StickyNote, Send } from 'lucide-react';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function authorBadgeClass(author: string): string {
  return author === 'agent'
    ? 'border-violet-200 bg-violet-50 text-violet-700'
    : 'border-gray-200 bg-gray-50 text-gray-600';
}

// ----------------------------------------------------------------
// NoteItem
// ----------------------------------------------------------------
interface NoteItemProps {
  note: Note;
  onDelete: (id: string) => Promise<void>;
}

function NoteItem({ note, onDelete }: NoteItemProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this note?')) return;
    setDeleting(true);
    try {
      await onDelete(note.id);
    } catch {
      toast.error('Failed to delete note.');
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              'gap-1 px-1.5 py-0 text-[10px]',
              authorBadgeClass(note.author),
            )}
          >
            {note.author === 'agent' ? (
              <Bot className="h-2.5 w-2.5" />
            ) : (
              <User className="h-2.5 w-2.5" />
            )}
            {note.author}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {formatDate(note.created_at)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-muted-foreground hover:text-destructive disabled:opacity-50"
          aria-label="Delete note"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.content}</p>
    </div>
  );
}

// ----------------------------------------------------------------
// AddNoteForm
// ----------------------------------------------------------------
interface AddNoteFormProps {
  onAdd: (content: string) => Promise<void>;
}

function AddNoteForm({ onAdd }: AddNoteFormProps) {
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    setPending(true);
    try {
      await onAdd(trimmed);
      setContent('');
    } catch {
      toast.error('Failed to add note.');
    } finally {
      setPending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a note… (Cmd+Enter to save)"
        className="min-h-[80px] resize-none text-sm"
        disabled={pending}
        rows={3}
      />
      <div className="flex items-center justify-end">
        <Button
          type="submit"
          size="sm"
          className="gap-1.5"
          disabled={pending || !content.trim()}
        >
          <Send className="h-3.5 w-3.5" />
          {pending ? 'Saving…' : 'Save Note'}
        </Button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------
// ContactNotes
// ----------------------------------------------------------------
interface ContactNotesProps {
  contactId: string;
}

export function ContactNotes({ contactId }: ContactNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotes(contactId);
      setNotes(data);
    } catch {
      toast.error('Failed to load notes.');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAdd = useCallback(
    async (content: string) => {
      const note = await createNote(contactId, { content });
      // Insert at beginning (newest first)
      setNotes((prev) => [note, ...prev]);
      toast.success('Note saved.');
    },
    [contactId],
  );

  const handleDelete = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNote(id);
      toast.success('Note deleted.');
    } catch {
      toast.error('Failed to delete note.');
      fetchNotes();
    }
  }, [fetchNotes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-xs text-muted-foreground">Loading notes…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">
          Notes
          {notes.length > 0 && (
            <span className="ml-1.5 text-muted-foreground">({notes.length})</span>
          )}
        </span>
      </div>

      {/* Add note form */}
      <AddNoteForm onAdd={handleAdd} />

      {/* Notes list — newest first */}
      {notes.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No notes yet. Add one above.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
