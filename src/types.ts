import { PrismaClient } from "@prisma/client";
export interface Address {
  address: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

// ==============================================================
// subscription
export type SubscriptionResponse = {
  isSubscribe: boolean;
  subscriptionStart: Date | null;
  subscriptionType: string | null;
};

// ==============================================================
// context

export interface TokenPayload {
  id: number;
  role: string;
}

export interface Context {
  prisma: PrismaClient;
  user?: (TokenPayload & { companyId?: number }) | null;
  company?: { id: number } | null;
  authError: string | null;
}



// ==============================================================