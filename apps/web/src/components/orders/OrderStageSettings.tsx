'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { OrderStageConfig } from '@agent-crm/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Trash2, Plus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createOrderStageConfig,
  updateOrderStageConfig,
  deleteOrderStageConfig,
} from '@/app/actions/orders';

interface OrderStageSettingsProps {
  stages: OrderStageConfig[];
}

const PRESET_COLORS = [
  '#f97316', '#3b82f6', '#22c55e', '#a855f7',
  '#ef4444', '#eab308', '#06b6d4', '#ec4899',
];

export function OrderStageSettings({ stages }: OrderStageSettingsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6b7280');
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => router.refresh(), [router]);

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createOrderStageConfig({ name: newName.trim(), color: newColor });
      toast.success('Stage added');
      setNewName('');
      setNewColor('#6b7280');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add stage');
    } finally {
      setSaving(false);
    }
  }

  async function handleRename(id: string, name: string) {
    try {
      await updateOrderStageConfig(id, { name });
      toast.success('Stage renamed');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename');
    }
  }

  async function handleColorChange(id: string, color: string) {
    try {
      await updateOrderStageConfig(id, { color });
      refresh();
    } catch {
      toast.error('Failed to update color');
    }
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const index = stages.findIndex((s) => s.id === id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= stages.length) return;

    try {
      await Promise.all([
        updateOrderStageConfig(stages[index].id, {
          sort_order: stages[swapIndex].sort_order,
        }),
        updateOrderStageConfig(stages[swapIndex].id, {
          sort_order: stages[index].sort_order,
        }),
      ]);
      refresh();
    } catch {
      toast.error('Failed to reorder');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteOrderStageConfig(id);
      toast.success('Stage deleted');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete stage');
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="self-end"
      >
        <Settings2 className="mr-1.5 h-3.5 w-3.5" />
        Manage Stages
      </Button>
    );
  }

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between px-4 pb-2 pt-3">
        <CardTitle className="text-sm font-semibold">Order Stages</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Done
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-4 pb-3">
        {stages.map((stage, i) => (
          <div
            key={stage.id}
            className="flex items-center gap-2 rounded-md border px-2 py-1.5"
          >
            <input
              type="color"
              value={stage.color}
              onChange={(e) => handleColorChange(stage.id, e.target.value)}
              className="h-6 w-6 shrink-0 cursor-pointer rounded border-0 p-0"
            />
            <Input
              defaultValue={stage.name}
              className="h-7 flex-1 text-sm"
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val && val !== stage.name) handleRename(stage.id, val);
              }}
            />
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleReorder(stage.id, 'up')}
                disabled={i === 0}
                className="rounded p-1 hover:bg-accent disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleReorder(stage.id, 'down')}
                disabled={i === stages.length - 1}
                className="rounded p-1 hover:bg-accent disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(stage.id)}
                className="rounded p-1 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Add new stage */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: newColor === c ? 'currentColor' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 shrink-0 rounded-full"
            style={{ backgroundColor: newColor }}
          />
          <Input
            placeholder="New stage name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-7 flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
          <Button size="sm" onClick={handleAdd} disabled={saving || !newName.trim()}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
