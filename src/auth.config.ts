import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/client";

/**
 * Edge-compatible NextAuth configuration.
 * Contains no Node.js runtime specific modules (such as Prisma or bcrypt)
 * so it can be safely used in middleware or edge routes.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.roles = (user.roles || []) as Role[];
        token.activeRole = user.activeRole as Role;
        token.timezone = user.timezone;
      }
      if (trigger === "update" && session) {
        const update = session as {
          activeRole?: Role;
          roles?: Role[];
          user?: { activeRole?: Role; roles?: Role[] };
        };
        const activeRole = update.activeRole ?? update.user?.activeRole;
        const roles = update.roles ?? update.user?.roles;

        if (activeRole) {
          token.activeRole = activeRole;
        }
        if (roles) {
          token.roles = roles;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        }
        if (token.roles) {
          session.user.roles = token.roles as Role[];
        }
        if (token.activeRole) {
          session.user.activeRole = token.activeRole as Role;
        }
        session.user.timezone = token.timezone as string | null | undefined;
      }
      return session;
    },
  },
  providers: [],
};
