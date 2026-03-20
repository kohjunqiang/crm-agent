'use client';

import { useState } from 'react';
import type { KnowledgeBaseEntry } from '@agent-crm/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createKnowledgeEntry, updateKnowledgeEntry } from '@/app/actions/knowledge';
import { toast } from 'sonner';

interface KBEntryModalProps {
  entry?: KnowledgeBaseEntry;
  onSave: () => void;
  onClose: () => void;
}

export function KBEntryModal({ entry, onSave, onClose }: KBEntryModalProps) {
  const [title, setTitle] = useState(entry?.title ?? '');
  const [content, setContent] = useState(entry?.content ?? '');
  const [saving, setSaving] = useState(false);

  const isEditing = !!entry;

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      if (isEditing) {
        await updateKnowledgeEntry(entry.id, { title, content });
      } else {
        await createKnowledgeEntry({ title, content });
      }
      toast.success(isEditing ? 'Entry updated' : 'Entry created');
      onSave();
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kb-title">Title</Label>
            <Input
              id="kb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Business Hours"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kb-content">Content</Label>
            <Textarea
              id="kb-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter knowledge base content..."
              rows={10}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
