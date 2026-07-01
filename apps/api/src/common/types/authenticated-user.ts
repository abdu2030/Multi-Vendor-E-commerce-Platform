import { Role } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};
