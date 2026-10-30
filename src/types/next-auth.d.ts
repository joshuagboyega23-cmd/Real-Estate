import type { Role } from "@/generated/prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    roles?: Role[];
    activeRole?: Role;
    timezone?: string | null;
  }

  interface Session {
    user: {
      id: string;
      roles: Role[];
      activeRole: Role;
      timezone?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: Role[];
    activeRole?: Role;
    timezone?: string | null;
  }
}
