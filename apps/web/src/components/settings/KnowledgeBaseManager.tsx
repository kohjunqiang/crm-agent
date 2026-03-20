'use client';

import { useEffect, useState, useCallback } from 'react';
import type { KnowledgeBaseEntry } from '@agent-crm/shared';
import { Button } from '@/components/ui/button';
import { getKnowledgeEntries, deleteKnowledgeEntry } from '@/app/actions/knowledge';
import { KBEntryModal } from './KBEntryModal';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export function KnowledgeBaseManager() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEntry, setModalEntry] = useState<KnowledgeBaseEntry | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBaseEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const data = await getKnowledgeEntries();
      setEntries(data);
    } catch {
      toast.error('Failed to load knowledge base entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function handleAdd() {
    setModalEntry(undefined);
    setShowModal(true);
  }

  function handleEdit(entry: KnowledgeBaseEntry) {
    setModalEntry(entry);
    setShowModal(true);
  }

  function handleModalClose() {
    setShowModal(false);
    setModalEntry(undefined);
  }

  function handleModalSave() {
    setShowModal(false);
    setModalEntry(undefined);
    fetchEntries();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteKnowledgeEntry(deleteTarget.id);
      toast.success('Entry deleted');
      setDeleteTarget(null);
      fetchEntries();
    } catch {
      toast.error('Failed to delete entry');
    } finally {
      setDeleting(false);
    }
  }

  const totalChars = entries.reduce((sum, e) => sum + e.title.length + e.content.length, 0);
  const estimatedTokens = Math.round(totalChars / 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Knowledge Base</h3>
        <Button onClick={handleAdd} size="sm">
          Add Entry
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No knowledge base entries yet.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between rounded-md border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{entry.title}</p>
                <p className="mt-1 text-sm text-muted-foreground truncate">
                  {entry.content.length > 100
                    ? entry.content.slice(0, 100) + '...'
                    : entry.content}
                </p>
              </div>
              <div className="ml-3 flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(entry)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget(entry)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Estimated tokens: {estimatedTokens.toLocaleString()}
          </p>
          {estimatedTokens > 50000 && (
            <p className="text-sm font-medium text-yellow-600">
              Warning: Knowledge base is large ({estimatedTokens.toLocaleString()} tokens). This may affect response quality and cost.
            </p>
          )}
        </div>
      )}

      {showModal && (
        <KBEntryModal
          entry={modalEntry}
          onSave={handleModalSave}
          onClose={handleModalClose}
        />
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
