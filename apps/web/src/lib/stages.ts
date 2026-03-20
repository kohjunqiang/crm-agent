import type { DealStage } from '@agent-crm/shared';

export const ACTIVE_STAGES: DealStage[] = [
  'discovery', 'consultation', 'quotation_sent', 'confirmed', 'ordered', 'fulfilled',
];

export const CLOSED_STAGES: DealStage[] = ['completed', 'lost'];
export const ALL_STAGES: DealStage[] = [...ACTIVE_STAGES, ...CLOSED_STAGES];

export const STAGE_LABELS: Record<DealStage, string> = {
  discovery: 'Discovery',
  consultation: 'Consultation',
  quotation_sent: 'Quotation Sent',
  confirmed: 'Confirmed',
  ordered: 'Ordered',
  fulfilled: 'Fulfilled',
  completed: 'Completed',
  lost: 'Lost',
};

export const STAGE_BADGE_COLORS: Record<DealStage, string> = {
  discovery: 'bg-gray-100 text-gray-700',
  consultation: 'bg-blue-100 text-blue-700',
  quotation_sent: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-violet-100 text-violet-700',
  ordered: 'bg-orange-100 text-orange-700',
  fulfilled: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export const STAGE_BORDER_COLORS: Record<DealStage, string> = {
  discovery: 'border-l-gray-400',
  consultation: 'border-l-blue-400',
  quotation_sent: 'border-l-amber-400',
  confirmed: 'border-l-violet-400',
  ordered: 'border-l-orange-400',
  fulfilled: 'border-l-teal-400',
  completed: 'border-l-green-400',
  lost: 'border-l-red-400',
};

export const STAGE_BAR_COLORS: Record<DealStage, string> = {
  discovery: 'bg-gray-300',
  consultation: 'bg-blue-300',
  quotation_sent: 'bg-amber-300',
  confirmed: 'bg-violet-300',
  ordered: 'bg-orange-300',
  fulfilled: 'bg-teal-300',
  completed: 'bg-green-300',
  lost: 'bg-red-300',
};
