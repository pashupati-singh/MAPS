import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";

const prisma = new PrismaClient();

export const ExpenseResolvers = {
  Query: {
    async getExpenseReport(_: any, { companyId, startDate, endDate }: { companyId: number; startDate: string; endDate: string }) {
      const expenses = await prisma.expense.findMany({
        where: {
          companyId,
          expenseDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      });

      const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        totalAmount,
        expenses,
      };
    },

    async getExpenseById(_: any, { id }: { id: number }) {
      const expense = await prisma.expense.findUnique({ where: { id } });
      if (!expense) {
        return createResponse(404, false, "Expense not found");
      }
      return createResponse(200, true, "Expense fetched successfully", expense);
    },
  },

  Mutation: {
    async createExpense(_: any, { data }: any, context: Context) {
      if (!context?.user) return createResponse(400, false, "User not authenticated");
      if (!context.company?.id) return createResponse(400, false, "Company ID missing");
      if(!data.amount || !data.expenseDate || !data.category) return createResponse(400, false, "Required fields are missing");
      const date = data.expenseDate ? new Date(data.expenseDate.split("T")[0]) : new Date();
      const expense = await prisma.expense.create({
        data: {
          amount: data.amount,
          expenseDate: date,
          category: data.category,
          description: data.description,
          userId: context.user.id,
          companyId: context.company.id,
        },
      });

      return createResponse(201, true, "Expense created successfully", expense);
    },

    async completeExpense(_: any, { userId }: { userId: number;  }, context: Context) {
      if (!context?.user) return createResponse(400, false, "User not authenticated");
      if(!context.company?.id) return createResponse(400, false, "Company ID missing");
      const companyId = context.company.id;
      if (context.user.id !== userId) {
        return createResponse(403, false, "You can only complete your own expenses");
      }

      await prisma.expense.updateMany({
        where: { userId, companyId, isCompleted: false },
        data: { isCompleted: true },
      });

      return createResponse(200, true, "Expenses marked as completed");
    },

    async approveExpense(_: any, { id }: { id: number }, context: Context) {
      if (!context?.user) return createResponse(400, false, "User not authenticated");

      const expense = await prisma.expense.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!expense) return createResponse(404, false, "Expense not found");
      if (!expense.isCompleted) {
        return createResponse(400, false, "User has not completed expenses yet");
      }

      if (expense.user.role === "MR") {
        if (context.user.role !== "ABM") {
          return createResponse(403, false, "Only ABM can approve MR expenses");
        }
      } else if (expense.user.role === "ABM") {
        if (context.user.role !== "ADMIN") {
          return createResponse(403, false, "Only Admin can approve ABM expenses");
        }
      } else {
        return createResponse(400, false, "Invalid expense owner role");
      }

      const updated = await prisma.expense.update({
        where: { id },
        data: { isApproved: true },
      });

      return createResponse(200, true, "Expense approved successfully", updated);
    },
  },
};
