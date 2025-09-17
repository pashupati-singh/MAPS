import { PrismaClient } from "@prisma/client";
import { SubscriptionResponse } from "../types";
const prisma = new PrismaClient();



async function getSubscriptionDetails(
  id: number,
  type: "user" | "company"
): Promise<SubscriptionResponse | null> {
  try {
    let company;

    if (type === "company") {
      company = await prisma.company.findUnique({
        where: { id },
        select: {
          isSubscribe: true,
          subscriptionStart: true,
          subscriptionType: true,
        },
      });
    } else if (type === "user") {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          company: {
            select: {
              isSubscribe: true,
              subscriptionStart: true,
              subscriptionType: true,
            },
          },
        },
      });
      company = user?.company ?? null;
    }

    if (!company) return null;

    return {
      isSubscribe: company.isSubscribe ?? false,
      subscriptionStart: company.subscriptionStart ?? null,
      subscriptionType: company.subscriptionType ?? null,
    };
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    throw error;
  }
}
