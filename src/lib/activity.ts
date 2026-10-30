import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface LogActivityParams {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Logs an action to the ActivityLog table.
 * Guaranteed never to throw; errors are logged to console.error.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

