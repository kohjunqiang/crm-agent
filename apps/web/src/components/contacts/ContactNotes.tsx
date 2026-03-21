'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Note } from '@agent-crm/shared';
import { toast } from 'sonner';
import { getNotes, createNote, deleteNote, uploadNoteImage, getNoteImageUrl } from '@/app/actions/notes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Bot, User, Trash2, StickyNote, Send, ImagePlus, X, Loader2 } from 'lucide-react';

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
// NoteImage — loads signed URL on mount
// ----------------------------------------------------------------
function NoteImage({ path, onClick }: { path: string; onClick: () => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    getNoteImageUrl(path).then(setUrl).catch(() => {});
  }, [path]);

  if (!url) {
    return <div className="h-20 w-20 animate-pulse rounded-md bg-muted" />;
  }

  return (
    <button type="button" onClick={onClick} className="overflow-hidden rounded-md">
      <img
        src={url}
        alt="Note attachment"
        className="h-20 w-20 object-cover transition-opacity hover:opacity-80"
      />
    </button>
  );
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

  const openLightbox = async (path: string) => {
    try {
      const url = await getNoteImageUrl(path);
      setLightboxUrl(url);
    } catch {
      toast.error('Failed to load image.');
    }
  };

  const images = note.image_urls ?? [];

  return (
    <>
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

        {/* Images */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((path) => (
              <NoteImage key={path} path={path} onClick={() => openLightbox(path)} />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-2xl p-2">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Note attachment" className="w-full rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ----------------------------------------------------------------
// AddNoteForm
// ----------------------------------------------------------------
interface AddNoteFormProps {
  onAdd: (content: string, imageUrls: string[]) => Promise<void>;
}

function AddNoteForm({ onAdd }: AddNoteFormProps) {
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);
  const [images, setImages] = useState<{ path: string; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const path = await uploadNoteImage(formData);
        const preview = URL.createObjectURL(file);
        setImages((prev) => [...prev, { path, preview }]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const removed = prev[idx];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && images.length === 0) return;
    setPending(true);
    try {
      await onAdd(trimmed || '(photo)', images.map((i) => i.path));
      setContent('');
      images.forEach((i) => URL.revokeObjectURL(i.preview));
      setImages([]);
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

  const canSubmit = (content.trim() || images.length > 0) && !uploading;

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

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div key={img.path} className="group relative">
              <img
                src={img.preview}
                alt="Upload preview"
                className="h-16 w-16 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {uploading && (
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => fileRef.current?.click()}
            disabled={pending || uploading}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Photo
          </Button>
        </div>
        <Button
          type="submit"
          size="sm"
          className="gap-1.5"
          disabled={pending || !canSubmit}
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
    async (content: string, imageUrls: string[]) => {
      const note = await createNote(contactId, {
        content,
        ...(imageUrls.length > 0 ? { image_urls: imageUrls } : {}),
      });
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
