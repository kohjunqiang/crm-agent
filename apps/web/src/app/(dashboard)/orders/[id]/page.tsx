import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getOrder, getOrderStageConfigs } from '@/app/actions/orders';
import { OrderDetailView } from '@/components/orders/OrderDetailView';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { id } = await params;

  let orderData;
  try {
    orderData = await getOrder(id);
  } catch {
    notFound();
  }

  const stages = await getOrderStageConfigs();

  return (
    <OrderDetailView
      order={orderData.order}
      items={orderData.items}
      stages={stages}
      history={orderData.history}
      payments={orderData.payments}
    />
  );
}
