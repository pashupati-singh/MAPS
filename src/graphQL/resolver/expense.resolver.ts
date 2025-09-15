import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ExpenseResolvers = {
  Query: {
    // Get expenses within date range
    async getExpenseReport(_: any, args: { companyId: number; startDate: string; endDate: string }) {
      const { companyId, startDate, endDate } = args;

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

    async getExpenseById(_: any, args: { id: number }) {
      const expense = await prisma.expense.findUnique({
        where: { id: args.id },
      });

      if (!expense) {
        return {
          code: 404,
          success: false,
          message: "Expense not found",
          data: null,
        };
      }

      return {
        code: 200,
        success: true,
        message: "Expense fetched successfully",
        data: expense,
      };
    },
  },

  Mutation: {
    async createExpense(_: any, args: { data: any }) {
      const { data } = args;

      const expense = await prisma.expense.create({
        data,
      });

      return {
        code: 201,
        success: true,
        message: "Expense created successfully",
        data: expense,
      };
    },

    async approveExpense(_: any, args: { id: number }) {
      const expense = await prisma.expense.update({
        where: { id: args.id },
        data: { isApproved: true },
      });

      return {
        code: 200,
        success: true,
        message: "Expense approved successfully",
        data: expense,
      };
    },
  },
};
