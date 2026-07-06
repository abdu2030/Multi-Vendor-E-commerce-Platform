import { OrderDetailClient } from "@/components/orders/order-detail-client";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OrderDetailClient orderId={id} />;
}
