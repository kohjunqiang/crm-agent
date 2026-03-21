'use client';

import { useState } from 'react';
import type { Order, UpdateOrderInput } from '@agent-crm/shared';
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
import { toast } from 'sonner';
import { updateOrder } from '@/app/actions/orders';

interface OrderEditDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function OrderEditDialog({
  order,
  open,
  onOpenChange,
  onSaved,
}: OrderEditDialogProps) {
  const [title, setTitle] = useState(order.title);
  const [notes, setNotes] = useState(order.notes ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState(order.delivery_address ?? '');
  const [deliveryDate, setDeliveryDate] = useState(order.delivery_date ?? '');
  const [deliveryNotes, setDeliveryNotes] = useState(order.delivery_notes ?? '');
  const [assignedTo, setAssignedTo] = useState(order.assigned_to ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const input: UpdateOrderInput = {
        title: title.trim(),
        notes: notes.trim() || null,
        delivery_address: deliveryAddress.trim() || null,
        delivery_date: deliveryDate || null,
        delivery_notes: deliveryNotes.trim() || null,
        assigned_to: assignedTo.trim() || null,
      };
      await updateOrder(order.id, input);
      toast.success('Order updated');
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="order-title">Title</Label>
            <Input
              id="order-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="order-notes">Notes</Label>
            <Textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="delivery-address">Delivery Address</Label>
            <Input
              id="delivery-address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="delivery-date">Delivery Date</Label>
              <Input
                id="delivery-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="assigned-to">Assigned Installer</Label>
              <Input
                id="assigned-to"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="delivery-notes">Delivery Notes</Label>
            <Textarea
              id="delivery-notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
