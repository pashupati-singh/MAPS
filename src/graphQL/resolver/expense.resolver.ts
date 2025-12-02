import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";
import { toUtcMidnight } from "../../utils/ConvertUTCToIST";

const prisma = new PrismaClient();

export const ExpenseResolvers = {
  Expense: {
    details(parent: any) {
      return parent.ExpenseDetails ?? [];
    },
  },
  Query: {
    async getExpenseById(_: any, { id }: { id: number }, context: Context) {
      if (!context?.user) return createResponse(400, false, "User not authenticated");

      const expense = await prisma.expense.findUnique({
        where: { id },
        include: { ExpenseDetails: true },
      });

      if (!expense) {
        return createResponse(404, false, "Expense not found");
      }
      const companyId = context.company?.id || context.user.companyId;
      if (!companyId || expense.companyId !== companyId) {
        return createResponse(403, false, "Not authorised to view this expense");
      }

      return createResponse(200, true, "Expense fetched successfully", expense);
    },

     async getExpenseByMonths(
  _: any,
  { dates }: { dates: string[] },
  context: Context
) {
  try {
    if (!context?.user) {
      return createResponse(400, false, "User not authenticated");
    }

    const userId = context.user.userId;
    const companyId = context.company?.id || context.user.companyId;

    if (!companyId) {
      return createResponse(400, false, "Company ID missing");
    }

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return createResponse(400, false, "dates array is required");
    }

    // Convert each date string (dd/mm/yyyy) to month-start Date (same as createExpense)
    const monthStarts = dates.map((dStr) => {
      const dt = toUtcMidnight(dStr);
      const year = dt.getUTCFullYear();
      const month = dt.getUTCMonth(); // 0–11
      return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    });

    // 👇 IMPORTANT: findMany instead of findFirst
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        companyId,
        ExpenseMonth: { in: monthStarts },
      },
      include: {
        ExpenseDetails: true,
      },
      orderBy: {
        ExpenseMonth: "asc", // or "desc" if you prefer
      },
    });

    if (!expenses || expenses.length === 0) {
      return {
      code: 200,
      success: true,
      message: "Expenses fetched successfully",
      data: [],
    }
    }

    return {
      code: 200,
      success: true,
      message: "Expenses fetched successfully",
      data: expenses,
    };
  } catch (err: any) {
    console.error("Error in getExpenseByMonths:", err);
    return createResponse(500, false, err.message);
  }
},

  },

  Mutation: {
    async createExpense(_: any, { data }: any, context: Context) {
      try {
        if (!context?.user) return createResponse(400, false, "User not authenticated");

        const userId = context.user.userId;
        const companyId = context.company?.id || context.user.companyId;

        if (!companyId) return createResponse(400, false, "Company ID missing");

        const { ta, da, ha, ca, oa, miscellaneous, reason, dates } = data;

        if (!ta && ta !== 0) return createResponse(400, false, "ta is required");
        if (!da && da !== 0) return createResponse(400, false, "da is required");
        if (!ha && ha !== 0) return createResponse(400, false, "ha is required");
        if (!ca && ca !== 0) return createResponse(400, false, "ca is required");
        if (!oa && oa !== 0) return createResponse(400, false, "oa is required");
        if (!dates || !Array.isArray(dates) || dates.length === 0) {
          return createResponse(400, false, "dates array is required");
        }
        const firstDate = toUtcMidnight(dates[0]);
        const year = firstDate.getUTCFullYear();
        const month = firstDate.getUTCMonth(); 
        const expenseMonthDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

        const count = dates.length;
        const taNum = Number(ta) || 0;
        const daNum = Number(da) || 0;
        const haNum = Number(ha) || 0;
        const caNum = Number(ca) || 0;
        const oaNum = Number(oa) || 0;
        const misNum = miscellaneous != null ? Number(miscellaneous) : 0;
        const dayTotal = taNum + daNum + haNum + caNum + oaNum + misNum;

        const deltaTotalTA = taNum * count;
        const deltaTotalDA = daNum * count;
        const deltaTotalHA = haNum * count;
        const deltaTotalCA = caNum * count;
        const deltaTotalOA = oaNum * count;
        const deltaTotalMis = misNum * count;
        const deltaAmount =
          deltaTotalTA +
          deltaTotalDA +
          deltaTotalHA +
          deltaTotalCA +
          deltaTotalOA +
          deltaTotalMis;
        const existingExpense = await prisma.expense.findFirst({
          where: {
            userId,
            companyId,
            ExpenseMonth: expenseMonthDate,
          },
        });

        let expenseId: number;

        if (!existingExpense) {
          const createdExpense = await prisma.expense.create({
            data: {
              userId,
              companyId,
              ExpenseMonth: expenseMonthDate,
              totalTA: deltaTotalTA,
              totalDA: deltaTotalDA,
              totalHA: deltaTotalHA,
              totalCA: deltaTotalCA,
              totalOA: deltaTotalOA,
              totalMis: deltaTotalMis,
              amount: deltaAmount,
            },
          });
          expenseId = createdExpense.id;
        } else {
          const updatedExpense = await prisma.expense.update({
            where: { id: existingExpense.id },
            data: {
              totalTA: { increment: deltaTotalTA },
              totalDA: { increment: deltaTotalDA },
              totalHA: { increment: deltaTotalHA },
              totalCA: { increment: deltaTotalCA },
              totalOA: { increment: deltaTotalOA },
              totalMis: { increment: deltaTotalMis },
              amount: { increment: deltaAmount },
            },
          });
          expenseId = updatedExpense.id;
        }
        const detailsData = dates.map((dStr: string) => ({
          expenseId,
          ta: taNum,
          da: daNum,
          ha: haNum,
          ca: caNum,
          oa: oaNum,
          miscellaneous: misNum,
          reason: reason || null,
          date: toUtcMidnight(dStr),
          total: dayTotal,                

        }));

        await prisma.expenseDetails.createMany({
          data: detailsData,
        });

        const finalExpense = await prisma.expense.findUnique({
          where: { id: expenseId },
          include: { ExpenseDetails: true },
        });

        return createResponse(
          201,
          true,
          existingExpense
            ? "Expense updated successfully for this month"
            : "Expense created successfully",
          finalExpense
        );
      } catch (err: any) {
        console.error("Error in createExpense:", err);
        return createResponse(500, false, err.message);
      }
    },

    async completeExpense(_: any, { expenseId }: { expenseId: number }, context: Context) {
      try {
        if (!context?.user) return createResponse(400, false, "User not authenticated");

        const expense = await prisma.expense.findUnique({
          where: { id: expenseId },
        });

        if (!expense) return createResponse(404, false, "Expense not found");

        const companyId = context.company?.id || context.user.companyId;
        const ctxUserId = context.user.userId;
        const role = context.user.role;

        if (!companyId || expense.companyId !== companyId) {
          return createResponse(403, false, "Not authorised to update this expense");
        }

        // MRs can only complete their own expenses
        if (role === "MR" && expense.userId !== ctxUserId) {
          return createResponse(403, false, "You can only complete your own expenses");
        }

        const updated = await prisma.expense.update({
          where: { id: expenseId },
          data: { isCompleted: true },
          include: { ExpenseDetails: true },
        });

        return createResponse(200, true, "Expense marked as completed", updated);
      } catch (err: any) {
        console.error("Error in completeExpense:", err);
        return createResponse(500, false, err.message);
      }
    },

    async approveExpense(_: any, { expenseId }: { expenseId: number }, context: Context) {
      try {
        if (!context?.user) return createResponse(400, false, "User not authenticated");

        const expense = await prisma.expense.findUnique({
          where: { id: expenseId },
          include: { user: true, ExpenseDetails: true },
        });

        if (!expense) return createResponse(404, false, "Expense not found");
        if (!expense.isCompleted) {
          return createResponse(400, false, "User has not completed expenses yet");
        }

        const approverRole = context.user.role;

        if (expense.user.role === "MR") {
          if (approverRole !== "ABM") {
            return createResponse(403, false, "Only ABM can approve MR expenses");
          }
        } else if (expense.user.role === "ABM") {
          if (approverRole !== "ADMIN") {
            return createResponse(403, false, "Only Admin can approve ABM expenses");
          }
        } else {
          return createResponse(400, false, "Invalid expense owner role");
        }

        const updated = await prisma.expense.update({
          where: { id: expenseId },
          data: { isApproved: true },
          include: { ExpenseDetails: true },
        });

        return createResponse(200, true, "Expense approved successfully", updated);
      } catch (err: any) {
        console.error("Error in approveExpense:", err);
        return createResponse(500, false, err.message);
      }
    },

    async updateExpenseDetails(_: any, { data }: any, context: Context) {
      try {
        if (!context?.user) return createResponse(400, false, "User not authenticated");

        const { expenseDetailsId, ta, da, ha, ca, oa, miscellaneous, reason } = data;

        if (!expenseDetailsId) {
          return createResponse(400, false, "expenseDetailsId is required");
        }

        const detail = await prisma.expenseDetails.findUnique({
          where: { id: expenseDetailsId },
          include: { Expense: true },
        });

        if (!detail) return createResponse(404, false, "Expense detail not found");

        const expense = detail.Expense;
        const companyId = context.company?.id || context.user.companyId;
        const ctxUserId = context.user.userId;
        const role = context.user.role;

        if (!companyId || expense?.companyId !== companyId) {
          return createResponse(403, false, "Not authorised to update this expense");
        }

        // MRs can only modify their own expense details
        if (role === "MR" && expense?.userId !== ctxUserId) {
          return createResponse(403, false, "You can only update your own expenses");
        }

        const oldTa = detail.ta ?? 0;
        const oldDa = detail.da ?? 0;
        const oldHa = detail.ha ?? 0;
        const oldCa = detail.ca ?? 0;
        const oldOa = detail.oa ?? 0;
        const oldMis = detail.miscellaneous ?? 0;

        const newTa = ta !== undefined ? Number(ta) : oldTa;
        const newDa = da !== undefined ? Number(da) : oldDa;
        const newHa = ha !== undefined ? Number(ha) : oldHa;
        const newCa = ca !== undefined ? Number(ca) : oldCa;
        const newOa = oa !== undefined ? Number(oa) : oldOa;
        const newMis =
          miscellaneous !== undefined ? Number(miscellaneous) : oldMis;

        const deltaTA = newTa - oldTa;
        const deltaDA = newDa - oldDa;
        const deltaHA = newHa - oldHa;
        const deltaCA = newCa - oldCa;
        const deltaOA = newOa - oldOa;
        const deltaMis = newMis - oldMis;
        const deltaAmount =
          deltaTA + deltaDA + deltaHA + deltaCA + deltaOA + deltaMis;

          const newTotal = newTa + newDa + newHa + newCa + newOa + newMis;
const oldTotal = detail.total ?? (oldTa + oldDa + oldHa + oldCa + oldOa + oldMis);
const deltaTotal = newTotal - oldTotal;

        const updateDetailData: any = {};
if (ta !== undefined) updateDetailData.ta = newTa;
if (da !== undefined) updateDetailData.da = newDa;
if (ha !== undefined) updateDetailData.ha = newHa;
if (ca !== undefined) updateDetailData.ca = newCa;
if (oa !== undefined) updateDetailData.oa = newOa;
if (miscellaneous !== undefined) updateDetailData.miscellaneous = newMis;
if (reason !== undefined) updateDetailData.reason = reason;
updateDetailData.total = newTotal;   // 👈 always keep total in sync


        await prisma.$transaction([
  prisma.expenseDetails.update({
    where: { id: expenseDetailsId },
    data: updateDetailData,
  }),
  prisma.expense.update({
    where: { id: expense.id },
    data: {
      totalTA: { increment: deltaTA },
      totalDA: { increment: deltaDA },
      totalHA: { increment: deltaHA },
      totalCA: { increment: deltaCA },
      totalOA: { increment: deltaOA },
      totalMis: { increment: deltaMis },
      amount: { increment: deltaAmount },
    },
  }),
]);


        const finalExpense = await prisma.expense.findUnique({
          where: { id: expense.id },
          include: { ExpenseDetails: true },
        });

        return createResponse(200, true, "Expense detail updated successfully", finalExpense);
      } catch (err: any) {
        console.error("Error in updateExpenseDetails:", err);
        return createResponse(500, false, err.message);
      }
    },

    async deleteExpenseDetails(
      _: any,
      { expenseDetailsIds }: { expenseDetailsIds: number[] },
      context: Context
    ) {
      try {
        if (!context?.user) return createResponse(400, false, "User not authenticated");

        if (!expenseDetailsIds || expenseDetailsIds.length === 0) {
          return createResponse(400, false, "expenseDetailsIds array is required");
        }

        const details = await prisma.expenseDetails.findMany({
          where: { id: { in: expenseDetailsIds } },
          include: { Expense: true },
        });

        if (details.length === 0) {
          return createResponse(404, false, "No expense details found");
        }

        // Ensure all belong to same Expense
         const expenseId: number | null = details[0]?.id ?? null;
        const sameExpense = details.every((d) => d.expenseId === expenseId);
        if (!sameExpense) {
          return createResponse(
            400,
            false,
            "All expenseDetailsIds must belong to the same expense"
          );
        }

        const expense = details[0]?.Expense;
        const companyId = context.company?.id || context.user.companyId;
        const ctxUserId = context.user.userId;
        const role = context.user.role;

        if (!companyId || expense?.companyId !== companyId) {
          return createResponse(403, false, "Not authorised to update this expense");
        }

        if (role === "MR" && expense?.userId !== ctxUserId) {
          return createResponse(403, false, "You can only delete your own expense details");
        }

       let sumTA = 0,
  sumDA = 0,
  sumHA = 0,
  sumCA = 0,
  sumOA = 0,
  sumMis = 0,
  sumTotal = 0;

for (const d of details) {
  const taVal = d.ta ?? 0;
  const daVal = d.da ?? 0;
  const haVal = d.ha ?? 0;
  const caVal = d.ca ?? 0;
  const oaVal = d.oa ?? 0;
  const misVal = d.miscellaneous ?? 0;

  sumTA += taVal;
  sumDA += daVal;
  sumHA += haVal;
  sumCA += caVal;
  sumOA += oaVal;
  sumMis += misVal;

  // if total is already stored, use it; otherwise compute on the fly
  sumTotal += d.total ?? (taVal + daVal + haVal + caVal + oaVal + misVal);
}

const deltaAmount = sumTotal;


        await prisma.$transaction([
  prisma.expense.update({
    where: { id: expenseId },
    data: {
      totalTA: { increment: -sumTA },
      totalDA: { increment: -sumDA },
      totalHA: { increment: -sumHA },
      totalCA: { increment: -sumCA },
      totalOA: { increment: -sumOA },
      totalMis: { increment: -sumMis },
      amount: { increment: -deltaAmount },
    },
  }),
  prisma.expenseDetails.deleteMany({
    where: { id: { in: expenseDetailsIds } },
  }),
]);


        const finalExpense = await prisma.expense.findUnique({
          where: { id: expenseId },
          include: { ExpenseDetails: true },
        });

        return createResponse(200, true, "Expense details deleted successfully", finalExpense);
      } catch (err: any) {
        console.error("Error in deleteExpenseDetails:", err);
        return createResponse(500, false, err.message);
      }
    },
  },
};
