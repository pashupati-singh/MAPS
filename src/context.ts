import { PrismaClient } from '@prisma/client';

export interface Context {
  prisma: PrismaClient;
  user?: { id: number , role : string  } | null | undefined;
  company?: { id: number } | null | undefined;
  authError: string | null;
}
