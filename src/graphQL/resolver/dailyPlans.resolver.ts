import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";

const prisma = new PrismaClient();

export const DailyPlanResolver = {
  Query: {
    getDailyPlans: async (_: any, { companyId }: { companyId: number }) => {
      try {
        if (!companyId) {
          return createResponse(400, false, "Company ID is required");
        }

        const plans = await prisma.dailyPlan.findMany({
          where: { companyId },
          orderBy: { planDate: "desc" },
          include: {
            doctors: true,
            chemists: true,
          },
        });

        const result = plans.map((plan : any) => ({
          ...plan,
          doctorIds: plan.doctors.map((d : any) => d.doctorId),
          chemistIds: plan.chemists.map((c : any) => c.chemistId),
        }));

        return createResponse(200, true, "Daily plans fetched successfully", result);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
    getDailyPlanById: async (_: any, { id }: { id: number }) => {
      try {
        if (!id) {
          return createResponse(400, false, "Daily Plan ID is required");
        }

        const plan = await prisma.dailyPlan.findUnique({
          where: { id },
          include: {
            doctors: true,
            chemists: true,
          },
        });

        if (!plan) {
          return createResponse(404, false, "Daily plan not found");
        }

        const result = {
          ...plan,
          doctorIds: plan.doctors.map(d => d.doctorId),
          chemistIds: plan.chemists.map(c => c.chemistId),
        };

        return createResponse(200, true, "Daily plan fetched successfully", result);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },

  Mutation: {
    createDailyPlan: async (_: any, { data }: any) => {
      try {
        const { mrId, abmId, companyId, doctorIds, chemistIds, workTogether, planDate, notes } = data;

        if (!mrId || !companyId || !planDate) {
          return createResponse(400, false, "MR ID, Company ID, and Plan Date are required");
        }
        const newPlan = await prisma.dailyPlan.create({
          data: {
            mrId,
            abmId,
            companyId,
            workTogether: workTogether || false,
            planDate: new Date(planDate),
            notes,
            doctors: {
              create: doctorIds?.map((doctorId: number) => ({ doctorId })) || [],
            },
            chemists: {
              create: chemistIds?.map((chemistId: number) => ({ chemistId })) || [],
            },
          },
          include: {
            doctors: true,
            chemists: true,
          },
        });

        const result = {
          ...newPlan,
          doctorIds: newPlan.doctors.map((d:any)=> d.doctorId),
          chemistIds: newPlan.chemists.map((c:any) => c.chemistId),
        };

        return createResponse(201, true, "Daily plan created successfully", result);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    updateDailyPlan: async (_: any, { data }: any) => {
      try {
        const { id, notes, doctorIds, chemistIds } = data;

        if (!id) {
          return createResponse(400, false, "Plan ID is required");
        }

        const plan = await prisma.dailyPlan.findUnique({
          where: { id },
          include: { doctors: true, chemists: true },
        });

        if (!plan) {
          return createResponse(404, false, "Daily plan not found");
        }

        const updatedData: any = {};
        if (notes !== undefined) {
          updatedData.notes = notes;
        }

       await prisma.dailyPlan.update({
          where: { id },
          data: updatedData,
        });

        if (doctorIds) {
          await prisma.dailyPlanDoctor.deleteMany({ where: { dailyPlanId: id } });
          await prisma.dailyPlanDoctor.createMany({
            data: doctorIds.map((doctorId: number) => ({ dailyPlanId: id, doctorId })),
            skipDuplicates: true,
          });
        }
        if (chemistIds) {
          await prisma.dailyPlanChemist.deleteMany({ where: { dailyPlanId: id } });
          await prisma.dailyPlanChemist.createMany({
            data: chemistIds.map((chemistId: number) => ({ dailyPlanId: id, chemistId })),
            skipDuplicates: true,
          });
        }

        const planWithRelations = await prisma.dailyPlan.findUnique({
          where: { id },
          include: {
            doctors: true,
            chemists: true,
          },
        });

        const result = {
          ...planWithRelations,
          doctorIds: planWithRelations?.doctors.map((d:any) => d.doctorId) || [],
          chemistIds: planWithRelations?.chemists.map((c:any) => c.chemistId) || [],
        };

        return createResponse(200, true, "Daily plan updated successfully", result);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    updateDailyPlanByAbm: async (_: any, { data }: any) => {
  try {
    const { id, isApproved, isRejected, isWorkTogetherConfirmed } = data;

    if (!id) {
      return createResponse(400, false, "Plan ID is required");
    }

    const plan = await prisma.dailyPlan.findUnique({
      where: { id },
      select: {
        id: true,
        isApproved: true,
        isRejected: true,
        workTogether: true,
        isWorkTogetherConfirmed: true,
      },
    });

    if (!plan) {
      return createResponse(404, false, "Daily plan not found");
    }

    // 🔒 Validation
    if (isApproved && isRejected) {
      return createResponse(400, false, "Plan cannot be both approved and rejected");
    }

    const updatedData: any = {};

    // ✅ ABM can approve or reject
    if (isApproved !== undefined) {
      updatedData.isApproved = isApproved;
      if (isApproved) updatedData.isRejected = false; // auto reset reject
    }
    if (isRejected !== undefined) {
      updatedData.isRejected = isRejected;
      if (isRejected) updatedData.isApproved = false; // auto reset approve
    }

    // ✅ ABM can confirm workTogether ONLY if MR set workTogether = true
    if (isWorkTogetherConfirmed !== undefined) {
      if (plan.workTogether) {
        updatedData.isWorkTogetherConfirmed = isWorkTogetherConfirmed;
      } else {
        return createResponse(400, false, "WorkTogether not requested by MR");
      }
    }

    const updatedPlan = await prisma.dailyPlan.update({
      where: { id },
      data: updatedData,
      include: {
        doctors: true,
        chemists: true,
      },
    });

    const result = {
      ...updatedPlan,
      doctorIds: updatedPlan.doctors.map((d: any) => d.doctorId),
      chemistIds: updatedPlan.chemists.map((c: any) => c.chemistId),
    };

    return createResponse(200, true, "Daily plan updated by ABM successfully", result);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},

    deleteDailyPlan: async (_: any, { id }: { id: number }) => {
      try {
        if (!id) {
          return createResponse(400, false, "Plan ID is required");
        }

        const plan = await prisma.dailyPlan.findUnique({ where: { id } });
        if (!plan) {
          return createResponse(404, false, "Daily plan not found");
        }
        await prisma.dailyPlanDoctor.deleteMany({ where: { dailyPlanId: id } });
        await prisma.dailyPlanChemist.deleteMany({ where: { dailyPlanId: id } });

        await prisma.dailyPlan.delete({ where: { id } });

        return createResponse(200, true, "Daily plan deleted successfully");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

  },
};
