'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrderStageConfig, Contact } from '@agent-crm/shared';
import { Search } from 'lucide-react';

interface OrderFiltersProps {
  stages: OrderStageConfig[];
  contacts: Contact[];
  search: string;
  onSearchChange: (value: string) => void;
  stageFilter: string;
  onStageFilterChange: (value: string) => void;
  clientFilter: string;
  onClientFilterChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
}

export function OrderFilters({
  stages,
  contacts,
  search,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
  clientFilter,
  onClientFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: OrderFiltersProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <div className="relative flex-1 sm:min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={stageFilter} onValueChange={onStageFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="All stages" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {stages.map((s) => (
            <SelectItem key={s.id} value={s.name}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={clientFilter} onValueChange={onClientFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="All clients" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All clients</SelectItem>
          {contacts.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name || c.phone || 'Unknown'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-full sm:w-[140px]"
          placeholder="From"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-full sm:w-[140px]"
        />
      </div>
    </div>
  );
}
