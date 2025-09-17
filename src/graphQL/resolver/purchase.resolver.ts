import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";

const prisma = new PrismaClient();

export const PurchaseResolver = {
  Query: {
    purchases: async (_: any, { companyId }: { companyId: number }, context: Context) => {
      if (!context.company?.id || context.company.id !== companyId) {
        return [];
      }

      return prisma.purchaseHistory.findMany({
        where: { companyId },
        orderBy: { purchaseDate: "desc" },
      });
    },
  },
  Mutation: {
    purchaseSubscription: async (
      _: any,
      { type, months, amountPaid, paymentReference }: any,
      context: Context
    ) => {
      try {
        if (!context.company?.id) {
          return createResponse(401, false, "Unauthorized: company token required");
        }

        const companyId = context.company.id;
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) return createResponse(404, false, "Company not found");

        const now = new Date();
        const startDate =
          company.subscriptionEnd && company.subscriptionEnd > now
            ? company.subscriptionEnd
            : now;
        const endDate = new Date(startDate);

        if (months) {
          endDate.setMonth(endDate.getMonth() + months);
        } else {
          switch (type) {
            case "TRIAL":
              endDate.setDate(endDate.getDate() + 14);
              break;
            case "MONTHLY":
              endDate.setMonth(endDate.getMonth() + 1);
              break;
            case "QUARTERLY":
              endDate.setMonth(endDate.getMonth() + 3);
              break;
            case "HALF_YEARLY":
              endDate.setMonth(endDate.getMonth() + 6);
              break;
            case "YEARLY":
              endDate.setFullYear(endDate.getFullYear() + 1);
              break;
          }
        }

        const purchase = await prisma.purchaseHistory.create({
          data: {
            companyId,
            subscriptionType: type,
            purchaseDate: now,
            expiryDate: endDate,
            amountPaid,
            paymentReference,
          },
        });

        await prisma.company.update({
          where: { id: companyId },
          data: {
            subscriptionType: type,
            isSubscribe: true,
            subscriptionStart: now,
            subscriptionEnd: endDate,
          },
        });

        return createResponse(200, true, "Subscription purchased successfully", purchase);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
