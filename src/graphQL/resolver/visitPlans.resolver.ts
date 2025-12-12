// -------------------- resolver --------------------
import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";
import { toUtcMidnight } from "../../utils/ConvertUTCToIST";

const prisma = new PrismaClient();

export const VisitPlansResolver = {
  Query: {
    getVisitPlans: async (
      _: any,
      args: { page?: number; limit?: number; workingAreaId?: number; date?: string },
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return { code: 400, success: false, message: context?.authError || "Authorization Error", data: [], lastPage: 0 };
        }

        const role = context.user?.role;
        const userId = context.user?.userId;

        const page = args.page && args.page > 0 ? args.page : 1;
        const limit = args.limit && args.limit > 0 ? args.limit : 10;

        const where: any = {};

        if (role === "ABM") where.abmId = userId;
        else if (role === "MR") where.mrId = userId;
        else return { code: 400, success: false, message: "Only ABM/MR can view visit plans", data: [], lastPage: 0 };

        if (typeof args.workingAreaId === "number") where.workingAreaId = args.workingAreaId;
        if (args.date) where.date = toUtcMidnight(args.date);

        const total = await prisma.visitPlans.count({ where });
        const lastPage = Math.ceil(total / limit) || 1;

        const data = await prisma.visitPlans.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ date: "desc" }, { id: "desc" }],
          include: {
            WorkingArea: true,
            abm: { select: { id: true, name: true, phone: true, email: true, role: true } },
            mr: { select: { id: true, name: true, phone: true, email: true, role: true } },
          },
        });

        return { code: 200, success: true, message: "Visit plans fetched successfully", data, lastPage };
      } catch (err: any) {
        return { code: 500, success: false, message: err.message, data: [], lastPage: 0 };
      }
    },
  },

  Mutation: {
   createVisitPlans: async (_: any, { data }: any, context: Context) => {
  try {
    if (!context || context.authError) {
      return { code: 400, success: false, message: context?.authError || "Authorization Error", data: [], lastPage: 0 };
    }
    if (context.user?.role !== "ABM") {
      return { code: 400, success: false, message: "Only ABM can create visit plans", data: [], lastPage: 0 };
    }

    const abmId = context.user.userId;
    const companyId = context.user.companyId;
    const { workingAreaId, date, stay } = data;

    if (!workingAreaId) return { code: 400, success: false, message: "workingAreaId is required", data: [], lastPage: 0 };
    if (!date) return { code: 400, success: false, message: "date is required", data: [], lastPage: 0 };

    const planDate = toUtcMidnight(date); // dd/mm/yyyy

    const assignments = await prisma.userWorkingArea.findMany({
      where: {
        workingAreaId,
        User: { is: { role: "MR", companyId } },
      },
      select: { userId: true },
    });

    const mrIds = assignments.map(a => a.userId).filter((x): x is number => typeof x === "number");
    if (mrIds.length === 0) {
      return { code: 404, success: false, message: "No MR found for this working area", data: [], lastPage: 0 };
    }

    // ✅ Block only if there's any NON-rejected plan for that date (ABM or any MR)
    const activeExists = await prisma.visitPlans.findFirst({
      where: {
        OR: [
          { abmId, date: planDate },
          { mrId: { in: mrIds }, date: planDate },
        ],
        status: { in: ["pending", "approved", "completed"] }, // allow if only rejected exists
      },
      select: { id: true },
    });

    if (activeExists) {
      return {
        code: 409,
        success: false,
        message: "Visit plan already exists for this date (pending/approved/completed).",
        data: [],
        lastPage: 0,
      };
    }

    const created = await prisma.$transaction(
      mrIds.map(mrId =>
        prisma.visitPlans.create({
          data: {
            abmId,
            mrId,
            workingAreaId,
            date: planDate,
            stay: typeof stay === "number" ? stay : null,
            status: "pending",
          },
          include: {
            WorkingArea: true,
            abm: { select: { id: true, name: true, phone: true, email: true, role: true } },
            mr: { select: { id: true, name: true, phone: true, email: true, role: true } },
          },
        })
      )
    );

    return { code: 201, success: true, message: "Visit plans created successfully", data: created, lastPage: 1 };
  } catch (err: any) {
    return { code: 500, success: false, message: err.message, data: [], lastPage: 0 };
  }
},


   updateVisitPlanStatus: async (_: any, { data }: any, context: Context) => {
  try {
    if (!context || context.authError) return createResponse(400, false, context?.authError || "Authorization Error");
    if (context.user?.role !== "MR") return createResponse(400, false, "Only MR can update visit plan status");

    const userId = context.user.userId;
    const { visitPlanId, approve, rejected } = data;

    if (!visitPlanId) return createResponse(400, false, "visitPlanId is required");

    // only one flag allowed
    if ((approve && rejected) || (!approve && !rejected)) {
      return createResponse(400, false, "Send either approve:true OR rejected:true");
    }

    const plan = await prisma.visitPlans.findUnique({ where: { id: visitPlanId } });
    if (!plan) return createResponse(404, false, "Visit plan not found");
    if (plan.mrId !== userId) return createResponse(403, false, "You are not allowed to update this visit plan");

    // Typically MR can decide only when pending
    if (plan.status !== "pending") {
      return createResponse(400, false, `Cannot update when status is ${plan.status}`);
    }

    const nextStatus = approve ? "approved" : "rejected";

    const updated = await prisma.visitPlans.update({
      where: { id: visitPlanId },
      data: { status: nextStatus },
      include: {
        WorkingArea: true,
        abm: { select: { id: true, name: true, phone: true, email: true, role: true } },
        mr: { select: { id: true, name: true, phone: true, email: true, role: true } },
      },
    });

    return createResponse(200, true, `Visit plan ${nextStatus} successfully`, updated);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},

  },
};
