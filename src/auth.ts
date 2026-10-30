import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { checkLoginRateLimit } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
          console.warn(`Rate limit exceeded for login attempt: ${normalizedEmail}`);
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

        // Log successful login activity
        await logActivity({
          actorId: user.id,
          action: "LOGIN",
          entityType: "User",
          entityId: user.id,
          metadata: { email: user.email },
        });

        // Return only safe user fields - never return passwordHash
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          timezone: user.timezone,
        };
      },
    }),
  ],
});
