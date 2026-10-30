import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  role: z.enum(["ADMIN", "CARETAKER", "TENANT"], {
    message: "Role must be ADMIN, CARETAKER, or TENANT",
  }),
  propertyId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

export interface CreateInvitationResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  inviteLink?: string;
}

export interface RevokeInvitationResult {
  success: boolean;
  error?: string;
}

export const acceptInviteSchema = z
  .object({
    token: z.string().min(1, "Invitation token is required"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export interface AcceptInviteResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

