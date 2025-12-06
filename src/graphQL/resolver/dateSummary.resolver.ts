import { PrismaClient } from "@prisma/client";
import { Context } from "../../context";
import { createResponse } from "../../utils/response";

const prisma = new PrismaClient();


function getUtcRangeFromDDMMYYYY(dateStr: string) {
  const [d, m, y] = dateStr.split("/").map(Number);

  if (!d || !m || !y) {
    throw new Error("Invalid date format. Expected dd/mm/yyyy");
  }

  // Start of day UTC
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  // Next day start UTC
  const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0));

  return { start, end };
}

export const DateSummaryResolver = {
  Query: {
    dateSummary: async (
      _: any,
      { date }: { date: string },
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return {
            code: 400,
            success: false,
            message: context?.authError || "Authorization Error",
            data: null,
          };
        }

        if (!context.user?.companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        if (!context.user?.userId) {
          return createResponse(400, false, "User authorization required");
        }

        if (!date) {
          return createResponse(400, false, "Date is required (dd/mm/yyyy)");
        }

        const { start, end } = getUtcRangeFromDDMMYYYY(date);
        const companyId = context.user.companyId;
        const userId = context.user.userId;
        const role = context.user.role;

        // --- DailyPlans (similar spirit to homePage) ---
        const basePlanFilter: any = {
          companyId,
          planDate: { gte: start, lt: end },
        };

        let planFilter: any;

        if (role === "ABM") {
          planFilter = {
            ...basePlanFilter,
            abmId: userId,
          };
        } else {
          // MR / others – show plans where user is MR
          planFilter = {
            ...basePlanFilter,
            mrId: userId,
          };
        }

        const dailyPlans = await prisma.dailyPlan.findMany({
          where: planFilter,
          include: {
            mr: true,
            // add more includes if you need
          },
          orderBy: { id: "asc" },
        });

        // --- Remindars for that user & date ---
        const remindars = await prisma.remindar.findMany({
          where: {
            userId,
            remindAt: { gte: start, lt: end },
          },
          orderBy: { remindAt: "asc" },
        });

        // --- Requests on that date (by requestedDate) ---
        const requests = await prisma.request.findMany({
          where: {
            companyId,
            requestedDate: { gte: start, lt: end },
            OR: [
              { userId },       // created by user
              { abmId: userId } // where user is ABM approver
            ],
          },
          orderBy: { id: "asc" },
        });

        // --- ExpenseDetails on that date, scoped to this user & company ---
        const expenseDetails = await prisma.expenseDetails.findMany({
          where: {
            date: { gte: start, lt: end },
            Expense: {
              companyId,
              userId,
            },
          },
          orderBy: { id: "asc" },
        });

        // --- Sales on that date, scoped to user & company ---
        const sales = await prisma.sale.findMany({
          where: {
            companyId,
            orderDate: { gte: start, lt: end },
            OR: [
              { mrId: userId },
              { abmId: userId },
            ],
          },
          orderBy: { id: "asc" },
        });

        return {
          code: 200,
          success: true,
          message: "Date summary fetched successfully",
          data: {
            date,
            dailyPlans,
            remindars,
            requests,
            expenseDetails,
            sales,
          },
        };
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
