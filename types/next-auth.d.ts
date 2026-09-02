import { UserRole } from "@/app/generated/prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: UserRole;
    schoolId: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      schoolId: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    schoolId?: string;
  }
}
