'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { DealProduct } from '@agent-crm/shared';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

type SpecFields = Pick<
  DealProduct,
  | 'width_cm'
  | 'drop_cm'
  | 'room_name'
  | 'window_position'
  | 'fixing_type'
  | 'stack_direction'
  | 'lining_type'
  | 'motorization'
  | 'notes'
>;

export interface LineItemSpecFormProps {
  specs: SpecFields;
  onChange: (specs: SpecFields) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// ----------------------------------------------------------------
// Predefined options per select field
// ----------------------------------------------------------------

const FIXING_TYPE_OPTIONS = ['Ceiling mount', 'Wall mount', 'Face fix', 'Inside recess', 'Outside recess'];
const STACK_DIRECTION_OPTIONS = ['Left', 'Right', 'Center', 'Split'];
const LINING_TYPE_OPTIONS = ['Unlined', 'Privacy', 'Blockout', 'Thermal'];
const MOTORIZATION_OPTIONS = ['Manual', 'Motorized', 'Smart home (Tuya/Zigbee)'];

// ----------------------------------------------------------------
// SelectWithCustom — datalist-based select+free-text hybrid
// ----------------------------------------------------------------

interface SelectWithCustomProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

function SelectWithCustom({ id, value, onChange, options, placeholder }: SelectWithCustomProps) {
  const listId = `${id}-list`;
  return (
    <>
      <input
        id={id}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm',
          'transition-colors placeholder:text-muted-foreground focus-visible:outline-none',
          'focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        )}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}

// ----------------------------------------------------------------
// FieldLabel
// ----------------------------------------------------------------

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-xs text-muted-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

// ----------------------------------------------------------------
// LineItemSpecForm
// ----------------------------------------------------------------

export function LineItemSpecForm({ specs, onChange, isOpen, onToggle }: LineItemSpecFormProps) {
  // Track whether user has interacted with required fields (for validation styling)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = <K extends keyof SpecFields>(key: K, value: SpecFields[K]) => {
    onChange({ ...specs, [key]: value });
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const requiredError = (field: 'width_cm' | 'drop_cm') =>
    touched[field] && isOpen && !specs[field];

  return (
    <div className="border-t">
      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        <span>Specs</span>
        {/* Summary badge when closed and specs are set */}
        {!isOpen && specs.width_cm && specs.drop_cm && (
          <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            {specs.width_cm} × {specs.drop_cm} cm
          </span>
        )}
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div className="flex flex-col gap-3 px-3 pb-3">
          {/* Two-column grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Width */}
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="spec-width" required>Width (cm)</FieldLabel>
              <Input
                id="spec-width"
                type="number"
                value={specs.width_cm ?? ''}
                onChange={(e) => set('width_cm', e.target.value ? parseFloat(e.target.value) : undefined)}
                onBlur={() => markTouched('width_cm')}
                placeholder="e.g. 180"
                min={0}
                step="0.1"
                className={cn('h-9 text-sm', requiredError('width_cm') && 'border-destructive')}
              />
              {requiredError('width_cm') && (
                <p className="text-[10px] text-destructive">Required</p>
              )}
            </div>

            {/* Drop */}
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="spec-drop" required>Drop (cm)</FieldLabel>
              <Input
                id="spec-drop"
                type="number"
                value={specs.drop_cm ?? ''}
                onChange={(e) => set('drop_cm', e.target.value ? parseFloat(e.target.value) : undefined)}
                onBlur={() => markTouched('drop_cm')}
                placeholder="e.g. 240"
                min={0}
                step="0.1"
                className={cn('h-9 text-sm', requiredError('drop_cm') && 'border-destructive')}
              />
              {requiredError('drop_cm') && (
                <p className="text-[10px] text-destructive">Required</p>
              )}
            </div>

            {/* Room name */}
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="spec-room">Room name</FieldLabel>
              <Input
                id="spec-room"
                value={specs.room_name ?? ''}
                onChange={(e) => set('room_name', e.target.value || undefined)}
                placeholder="e.g. Master bedroom"
                className="h-9 text-sm"
              />
            </div>

            {/* Window position */}
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="spec-position">Window position</FieldLabel>
              <Input
                id="spec-position"
                value={specs.window_position ?? ''}
                onChange={(e) => set('window_position', e.target.value || undefined)}
                placeholder="e.g. North-facing"
                className="h-9 text-sm"
              />
            </div>

            {/* Fixing type */}
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="spec-fixing">Fixing type</FieldLabel>
              <SelectWithCustom
                id="spec-fixing"
                value={specs.fixing_type ?? ''}
                onChange={(v) => set('fixing_type', v || undefined)}
                options={FIXING_TYPE_OPTIONS}
                placeholder="Select or type..."
              />
            </div>

            {/* Stack direction */}
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="spec-stack">Stack direction</FieldLabel>
              <SelectWithCustom
                id="spec-stack"
                value={specs.stack_direction ?? ''}
                onChange={(v) => set('stack_direction', v || undefined)}
                options={STACK_DIRECTION_OPTIONS}
                placeholder="Select or type..."
              />
            </div>

            {/* Lining type */}
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="spec-lining">Lining type</FieldLabel>
              <SelectWithCustom
                id="spec-lining"
                value={specs.lining_type ?? ''}
                onChange={(v) => set('lining_type', v || undefined)}
                options={LINING_TYPE_OPTIONS}
                placeholder="Select or type..."
              />
            </div>

            {/* Motorization */}
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="spec-motor">Motorization</FieldLabel>
              <SelectWithCustom
                id="spec-motor"
                value={specs.motorization ?? ''}
                onChange={(v) => set('motorization', v || undefined)}
                options={MOTORIZATION_OPTIONS}
                placeholder="Select or type..."
              />
            </div>
          </div>

          {/* Notes — full width */}
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="spec-notes">Notes</FieldLabel>
            <textarea
              id="spec-notes"
              value={specs.notes ?? ''}
              onChange={(e) => set('notes', e.target.value || undefined)}
              placeholder="Any additional notes..."
              rows={2}
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm',
                'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1',
                'focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none',
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
