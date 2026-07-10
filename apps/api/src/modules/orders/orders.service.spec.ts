import { OrdersService } from "./orders.service";

describe("OrdersService", () => {
  it("lists only orders owned by the authenticated buyer", async () => {
    const prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue([buildBuyerOrder()])
      }
    };
    const service = new OrdersService(prisma as never);

    const result = await service.listBuyerOrders("buyer_1");

    expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { buyerId: "buyer_1" },
      orderBy: { placedAt: "desc" }
    }));
    expect(result.total).toBe(1);
    expect(result.orders[0]).toMatchObject({
      id: "order_1",
      orderNumber: "ORD-TEST",
      itemCount: 1,
      totals: {
        totalCents: 2500,
        currency: "USD"
      }
    });
  });

  it("loads order detail by buyer id and order id", async () => {
    const prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue({
          ...buildBuyerOrder(),
          shippingAddress: { line1: "123 Market Street" },
          updatedAt: new Date("2026-07-01T11:00:00.000Z"),
          items: [
            {
              id: "order_item_1",
              productId: "product_1",
              productTitle: "Seller Product",
              productImage: null,
              unitPriceCents: 2500,
              quantity: 1,
              totalCents: 2500,
              sellerFulfillmentStatus: "PAID",
              trackingNumber: null,
              product: { id: "product_1", slug: "seller-product", status: "APPROVED" },
              store: { id: "store_1", name: "Seller One", slug: "seller-one" }
            }
          ]
        })
      }
    };
    const service = new OrdersService(prisma as never);

    const result = await service.getBuyerOrder("buyer_1", "order_1");

    expect(prisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: "order_1",
        buyerId: "buyer_1"
      }
    }));
    expect(result).toMatchObject({
      id: "order_1",
      itemCount: 1,
      shippingAddress: { line1: "123 Market Street" }
    });
  });
});

function buildBuyerOrder() {
  return {
    id: "order_1",
    orderNumber: "ORD-TEST",
    status: "PAID",
    subtotalCents: 2500,
    shippingCents: 0,
    taxCents: 0,
    discountCents: 0,
    totalCents: 2500,
    placedAt: new Date("2026-07-01T10:00:00.000Z"),
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    items: [
      {
        id: "order_item_1",
        productTitle: "Seller Product",
        productImage: null,
        quantity: 1,
        totalCents: 2500,
        store: { id: "store_1", name: "Seller One", slug: "seller-one" }
      }
    ],
    _count: { items: 1 },
    payment: {
      id: "payment_1",
      provider: "stripe",
      status: "PAID",
      amountCents: 2500,
      currency: "USD",
      createdAt: new Date("2026-07-01T10:00:00.000Z")
    }
  };
}
