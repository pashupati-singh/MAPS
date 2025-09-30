import { PrismaClient } from '@prisma/client';

export interface Context {
  prisma: PrismaClient;
  user?: { userId: number , role : string , companyId?: number  } | null | undefined;
  company?: { id: number } | null | undefined;
  authError: string | null;
}
