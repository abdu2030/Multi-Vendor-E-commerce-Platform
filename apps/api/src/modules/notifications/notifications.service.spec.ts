import { NotificationType } from "@prisma/client";
import { NotFoundException } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

describe("NotificationsService dashboard reads", () => {
  function createService(prisma: Record<string, unknown>) {
    return new NotificationsService(
      prisma as never,
      { enqueue: jest.fn() } as never,
      { enqueue: jest.fn() } as never
    );
  }

  it("lists only the authenticated user's notifications with unread metadata", async () => {
    const notification = {
      id: "notification_1",
      type: NotificationType.ORDER,
      title: "Order shipped",
      message: "Your order is on the way.",
      readAt: null,
      createdAt: new Date("2026-07-10T10:00:00.000Z")
    };
    const prisma = {
      notification: {
        findMany: jest.fn().mockResolvedValue([notification]),
        count: jest.fn()
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(1)
      }
    };
    const service = createService(prisma);

    const result = await service.listForUser("buyer_1", {
      unreadOnly: true,
      page: 1,
      limit: 12
    });

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: "buyer_1", readAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 0,
      take: 12,
      select: expect.any(Object)
    });
    expect(result).toMatchObject({
      notifications: [notification],
      unreadCount: 1,
      pagination: { page: 1, limit: 12, total: 1, totalPages: 1 }
    });
  });

  it("does not mark another user's notification as read", async () => {
    const prisma = {
      notification: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn()
      }
    };
    const service = createService(prisma);

    await expect(service.markRead("buyer_1", "notification_other")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });
});
