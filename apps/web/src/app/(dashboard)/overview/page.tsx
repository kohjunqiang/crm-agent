import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getDeals } from '@/app/actions/deals';
import { getActivities } from '@/app/actions/activities';
import { getAllPayments } from '@/app/actions/payments';
import { getContacts } from '@/app/actions/contacts';
import type { Deal, Payment, Activity, Contact } from '@agent-crm/shared';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { TasksDue } from '@/components/tasks/TasksDue';
import { getTasks } from '@/app/actions/tasks';
import type { Task } from '@agent-crm/shared';
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Clock,
  Bot,
  User,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, formatEventType, getContactName } from '@/lib/format';
import { ActivityCalendar } from '@/components/calendar/ActivityCalendar';
import { STAGE_LABELS } from '@/lib/stages';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ----------------------------------------------------------------
// Attention alerts
// ----------------------------------------------------------------

interface AttentionItem {
  id: string;
  dealTitle: string;
  contactName: string;
  message: string;
  type: 'stale_quote' | 'partial_payment' | 'stuck';
  daysAgo: number;
}

function generateAttentionItems(
  deals: Deal[],
  payments: Payment[],
  contacts: Contact[],
): AttentionItem[] {
  const now = Date.now();
  const items: AttentionItem[] = [];

  // Group payments by deal
  const paymentsByDeal = new Map<string, number>();
  for (const p of payments) {
    paymentsByDeal.set(p.deal_id, (paymentsByDeal.get(p.deal_id) ?? 0) + p.amount);
  }

  for (const deal of deals) {
    if (deal.stage === 'completed' || deal.stage === 'lost') continue;

    const daysSinceUpdate = Math.floor(
      (now - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24),
    );
    const contactName = getContactName(contacts, deal.contact_id);
    const paid = paymentsByDeal.get(deal.id) ?? 0;

    // Stale quotation (sent > 3 days ago)
    if (deal.stage === 'quotation_sent' && daysSinceUpdate > 3) {
      items.push({
        id: deal.id,
        dealTitle: deal.title,
        contactName,
        message: `Quotation sent ${daysSinceUpdate} days ago, no response`,
        type: 'stale_quote',
        daysAgo: daysSinceUpdate,
      });
    }
    // Partial payment outstanding
    else if (
      deal.amount !== null &&
      deal.amount > 0 &&
      paid > 0 &&
      paid < deal.amount
    ) {
      items.push({
        id: deal.id,
        dealTitle: deal.title,
        contactName,
        message: `Partial payment ${formatCurrency(paid)} / ${formatCurrency(deal.amount)}`,
        type: 'partial_payment',
        daysAgo: daysSinceUpdate,
      });
    }
    // Stuck in stage > 14 days
    else if (daysSinceUpdate > 14) {
      items.push({
        id: deal.id,
        dealTitle: deal.title,
        contactName,
        message: `Stuck in ${STAGE_LABELS[deal.stage]} for ${daysSinceUpdate} days`,
        type: 'stuck',
        daysAgo: daysSinceUpdate,
      });
    }
  }

  return items.sort((a, b) => b.daysAgo - a.daysAgo);
}

// ----------------------------------------------------------------
// Components
// ----------------------------------------------------------------

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="flex-1 gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className="text-xl font-semibold tracking-tight">
              {value}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {subtitle}
            </span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AttentionSection({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="px-5 pb-2 pt-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Needs Attention
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-5 pb-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href="/deals"
            className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium">{item.dealTitle}</span>
              <span className="text-xs text-muted-foreground">
                {item.contactName} — {item.message}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

// PipelineSection removed — now using PipelineBoard client component

function ActivitySection({
  activities,
  contacts,
}: {
  activities: Activity[];
  contacts: Contact[];
}) {
  return (
    <Card className="flex-1 gap-0 py-0 shadow-none">
      <CardHeader className="px-5 pb-2 pt-4">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5 px-5 pb-4">
        {activities.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No activity yet.
          </p>
        ) : (
          activities.slice(0, 8).map((activity) => {
            const contact = activity.contact_id
              ? contacts.find((c) => c.id === activity.contact_id)
              : null;
            const contactName = contact
              ? contact.name || contact.phone || 'Unknown'
              : null;
            const contactTags = contact?.tags ?? [];

            return (
              <div
                key={activity.id}
                className="flex items-start gap-2.5 rounded-md px-2 py-2"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                  {activity.actor === 'agent' ? (
                    <Bot className="h-3 w-3 text-violet-600" />
                  ) : (
                    <User className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-xs font-medium">
                    {formatEventType(activity.event_type)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {contactName ? (
                      <span className="text-[11px] text-muted-foreground">
                        {contactName}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        {activity.entity_type}
                      </span>
                    )}
                    {contactTags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-1.5 py-0 text-[9px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatRelativeTime(activity.created_at)}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function OverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const userEmail = user.email ?? '';
  const userName = userEmail.split('@')[0] ?? 'there';

  // Fetch all data in parallel
  const [deals, activities, payments, contacts, tasks] = await Promise.all([
    getDeals(),
    getActivities(),
    getAllPayments(),
    getContacts(),
    getTasks(),
  ]);

  // KPI calculations
  const activeDeals = deals.filter(
    (d) => d.stage !== 'completed' && d.stage !== 'lost',
  );
  const pipelineValue = activeDeals.reduce(
    (sum, d) => sum + (d.amount ?? 0),
    0,
  );

  // This month's revenue (payments in current month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthPayments = payments.filter(
    (p) => new Date(p.created_at) >= monthStart,
  );
  const thisMonthRevenue = thisMonthPayments.reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const completedThisMonth = deals.filter(
    (d) =>
      d.stage === 'completed' &&
      new Date(d.updated_at) >= monthStart,
  ).length;

  // Outstanding (partial payments)
  const paymentsByDeal = new Map<string, number>();
  for (const p of payments) {
    paymentsByDeal.set(
      p.deal_id,
      (paymentsByDeal.get(p.deal_id) ?? 0) + p.amount,
    );
  }
  let outstanding = 0;
  for (const deal of activeDeals) {
    if (deal.amount !== null && deal.amount > 0) {
      const paid = paymentsByDeal.get(deal.id) ?? 0;
      if (paid > 0 && paid < deal.amount) {
        outstanding += deal.amount - paid;
      }
    }
  }

  // Attention items
  const attentionItems = generateAttentionItems(deals, payments, contacts);

  return (
    <div className="flex flex-col gap-4">
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-semibold">
          {getGreeting()}, <span className="capitalize">{userName}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s your pipeline overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Active Deals"
          value={String(activeDeals.length)}
          subtitle={`across ${new Set(activeDeals.map((d) => d.stage)).size} stages`}
          icon={Briefcase}
        />
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(pipelineValue)}
          subtitle={`${activeDeals.length} deal${activeDeals.length !== 1 ? 's' : ''}`}
          icon={DollarSign}
        />
        <StatCard
          label="This Month"
          value={formatCurrency(thisMonthRevenue)}
          subtitle={`${completedThisMonth} completed`}
          icon={TrendingUp}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          subtitle="partial payments"
          icon={Clock}
        />
      </div>

      {/* Needs Attention */}
      <AttentionSection items={attentionItems} />

      {/* Pipeline + Tasks + Activity side by side */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <PipelineBoard deals={deals} contacts={contacts} />
        <TasksDue initialTasks={tasks} contacts={contacts} />
        <ActivitySection activities={activities} contacts={contacts} />
      </div>

      {/* Activity Calendar */}
      <ActivityCalendar activities={activities} contacts={contacts} />
    </div>
  );
}
