import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getOrders, getOrderStageConfigs } from '@/app/actions/orders';
import { getContacts } from '@/app/actions/contacts';
import { getAllPayments } from '@/app/actions/payments';
import { OrderList } from '@/components/orders/OrderList';
import { OrderStageSettings } from '@/components/orders/OrderStageSettings';

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [orders, stages, contacts, payments] = await Promise.all([
    getOrders(),
    getOrderStageConfigs(),
    getContacts(),
    getAllPayments(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Orders</h1>
        <OrderStageSettings stages={stages} />
      </div>
      <OrderList
        orders={orders}
        stages={stages}
        contacts={contacts}
        payments={payments}
      />
    </div>
  );
}
