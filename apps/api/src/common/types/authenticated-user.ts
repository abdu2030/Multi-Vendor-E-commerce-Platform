import { Role } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  role: Role;
  sessionId?: string;
  email?: string;
  fullName?: string;
};