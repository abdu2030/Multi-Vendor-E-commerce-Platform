import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateSellerApplicationInput,
  SellerApplication,
  SellerDecisionInput
} from "./seller-application.types";
import {
  validateDecisionReason,
  validateSellerApplicationInput
} from "./seller-applications.validation";

@Injectable()
export class SellerApplicationsService {
  private readonly applications: SellerApplication[] = [
    {
      id: "app_seed_mira",
      storeName: "Mira Home Studio",
      storeDescription: "Warm home goods from an independent seller ready for marketplace review.",
      phone: "+1 555 0134",
      address: "Portland, Oregon, United States",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  create(input: CreateSellerApplicationInput) {
    const data = validateSellerApplicationInput(input);
    const now = new Date().toISOString();
    const existingPending = this.applications.find(
      (application) =>
        application.storeName.toLowerCase() === data.storeName.toLowerCase() &&
        application.status === "pending"
    );

    if (existingPending) {
      throw new ConflictException("A seller application for this store is already under review.");
    }

    const application: SellerApplication = {
      id: `app_${Date.now().toString(36)}`,
      ...data,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };

    this.applications.unshift(application);

    return {
      message: "Your seller application is under review.",
      application
    };
  }

  pending() {
    return {
      items: this.applications.filter((application) => application.status === "pending"),
      total: this.applications.filter((application) => application.status === "pending").length
    };
  }

  approve(id: string, adminId: string) {
    const application = this.findApplication(id);
    this.ensurePending(application);
    return this.updateDecision(application, {
      status: "approved",
      reviewedBy: adminId
    });
  }

  reject(id: string, input: SellerDecisionInput, adminId: string) {
    const application = this.findApplication(id);
    this.ensurePending(application);
    const reason = validateDecisionReason(input, "reject");
    return this.updateDecision(application, {
      status: "rejected",
      rejectionReason: reason,
      reviewedBy: adminId
    });
  }

  suspend(id: string, input: SellerDecisionInput, adminId: string) {
    const application = this.findApplication(id);
    const reason = validateDecisionReason(input, "suspend");
    return this.updateDecision(application, {
      status: "suspended",
      suspensionReason: reason,
      reviewedBy: adminId
    });
  }

  private findApplication(id: string) {
    const application = this.applications.find((item) => item.id === id);

    if (!application) {
      throw new NotFoundException("Seller application was not found.");
    }

    return application;
  }

  private ensurePending(application: SellerApplication) {
    if (application.status !== "pending") {
      throw new ConflictException("Only pending seller applications can be approved or rejected.");
    }
  }

  private updateDecision(
    application: SellerApplication,
    changes: Pick<SellerApplication, "status" | "reviewedBy"> &
      Partial<Pick<SellerApplication, "rejectionReason" | "suspensionReason">>
  ) {
    const now = new Date().toISOString();
    Object.assign(application, {
      ...changes,
      reviewedAt: now,
      updatedAt: now
    });

    return {
      message: `Seller application ${application.status}.`,
      application
    };
  }
}
