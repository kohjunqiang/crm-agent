'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { advanceOrderStage } from '@/app/actions/orders';

interface OrderAdvanceDialogProps {
  orderId: string;
  currentStage: string;
  nextStage: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdvanced: () => void;
}

export function OrderAdvanceDialog({
  orderId,
  currentStage,
  nextStage,
  open,
  onOpenChange,
  onAdvanced,
}: OrderAdvanceDialogProps) {
  const [note, setNote] = useState('');
  const [advancing, setAdvancing] = useState(false);

  async function handleAdvance() {
    setAdvancing(true);
    try {
      await advanceOrderStage(orderId, note.trim() || undefined);
      toast.success(`Advanced to ${nextStage}`);
      onAdvanced();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to advance stage',
      );
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Advance Stage</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Move from <span className="font-medium text-foreground">{currentStage}</span>{' '}
          to <span className="font-medium text-foreground">{nextStage}</span>
        </p>
        <div>
          <Label htmlFor="advance-note">Note (optional)</Label>
          <Textarea
            id="advance-note"
            placeholder="Add a note about this transition..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdvance} disabled={advancing}>
            {advancing ? 'Advancing...' : `Advance to ${nextStage}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
