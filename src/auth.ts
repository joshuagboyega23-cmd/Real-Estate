import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import type { Role } from "@/generated/prisma/client";

const roleValues = ["OWNER", "ADMIN", "CARETAKER", "TENANT"] as const satisfies readonly Role[];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && roleValues.some((role) => role === value);
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function determineActiveRole(roles: Role[], lastActiveRole?: Role | null): Role {
  if (lastActiveRole && roles.includes(lastActiveRole)) {
    return lastActiveRole;
  }
  const priority: Role[] = ["OWNER", "ADMIN", "CARETAKER", "TENANT"];
  for (const r of priority) {
    if (roles.includes(r)) return r;
  }
  return roles[0] || "TENANT";
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        if (typeof user.id === "string") token.id = user.id;
        token.roles = (user.roles || []) as Role[];
        token.activeRole = user.activeRole as Role;
        token.timezone = user.timezone;
      }

      if (trigger === "update" && typeof token.id === "string") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { roles: true, lastActiveRole: true, isActive: true },
        });

        if (dbUser?.isActive) {
          token.roles = dbUser.roles;
          const update = session as {
            activeRole?: unknown;
            user?: { activeRole?: unknown };
          } | undefined;
          const requestedRole = update?.activeRole ?? update?.user?.activeRole;

          if (isRole(requestedRole) && dbUser.roles.includes(requestedRole)) {
            token.activeRole = requestedRole;
          } else if (!dbUser.roles.includes(token.activeRole as Role)) {
            token.activeRole = determineActiveRole(dbUser.roles, dbUser.lastActiveRole);
          }
        }
      }

      return token;
    },
  },
  // Note: When using JWT strategy with Credentials provider, adapter can be included
  // for database management operations while session strategy remains "jwt".
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials);
        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const normalizedEmail = email.toLowerCase().trim();

        // Rate limit verification
        const rateLimit = checkLoginRateLimit(normalizedEmail);
        if (!rateLimit.success) {
          console.warn("Rate limit exceeded for login attempts.");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.passwordHash || !user.isActive) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordsMatch) {
          return null;
        }

        const activeRole = determineActiveRole(user.roles, user.lastActiveRole);

        if (user.lastActiveRole !== activeRole) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastActiveRole: activeRole },
          });
        }

        // Log successful login activity
        await logActivity({
          actorId: user.id,
          action: "LOGIN",
          entityType: "User",
          entityId: user.id,
          metadata: { email: user.email, activeRole },
        });

        // Return only safe user fields - never return passwordHash
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          activeRole,
          timezone: user.timezone,
        };
      },
    }),
  ],
});
