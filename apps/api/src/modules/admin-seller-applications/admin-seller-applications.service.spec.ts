import { SellerApplicationStatus } from "@prisma/client";
import { EmailQueueService } from "../jobs/email-queue.service";
import { AdminSellerApplicationsService } from "./admin-seller-applications.service";

describe("AdminSellerApplicationsService email jobs", () => {
  it("queues the reviewed seller decision after rejection commits", async () => {
    const reviewedApplication = {
      id: "application_1",
      storeName: "Seller Store",
      rejectionReason: "Document needs renewal",
      user: {
        fullName: "Seller One",
        email: "seller@example.com"
      }
    };
    const tx = {
      sellerApplication: {
        update: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue(reviewedApplication)
      },
      user: { updateMany: jest.fn() },
      auditLog: { create: jest.fn() }
    };
    const prisma = {
      sellerApplication: {
        findUnique: jest.fn().mockResolvedValue({
          id: "application_1",
          userId: "seller_user_1",
          storeName: "Seller Store",
          storeDescription: "Independent goods",
          phone: "+251900000000",
          status: SellerApplicationStatus.PENDING
        })
      },
      $transaction: jest.fn((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    };
    const enqueue = jest.fn().mockResolvedValue(true);
    const service = new AdminSellerApplicationsService(
      prisma as never,
      { enqueue } as unknown as EmailQueueService
    );

    const result = await service.reject("application_1", "admin_1", "Document needs renewal");

    expect(result).toBe(reviewedApplication);
    expect(enqueue).toHaveBeenCalledWith(
      "seller-decision-application_1-rejected",
      {
        kind: "seller-decision",
        to: "seller@example.com",
        recipientName: "Seller One",
        applicationId: "application_1",
        storeName: "Seller Store",
        decision: "rejected",
        reason: "Document needs renewal"
      }
    );
  });
});
