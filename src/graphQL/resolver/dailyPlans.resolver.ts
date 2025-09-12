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

        const mr = await prisma.user.findUnique({ where: { id: mrId } });
        if (!mr) {
          return createResponse(404, false, "MR not found");
        }
        if (mr.companyId !== companyId) {
          return createResponse(400, false, "MR must belong to the same company");
        }

        if (abmId) {
          const abm = await prisma.user.findUnique({ where: { id: abmId } });
          if (!abm) {
            return createResponse(404, false, "ABM not found");
          }
          if (abm.companyId !== companyId) {
            return createResponse(400, false, "ABM must belong to the same company");
          }
        }
        for (const doctorId of doctorIds || []) {
          const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
          if (!doctor) {
            return createResponse(404, false, `Doctor with ID ${doctorId} not found`);
          }
          const doctorCompany = await prisma.doctorCompany.findFirst({
            where: { doctorId, companyId },
          });
          if (!doctorCompany) {
            return createResponse(400, false, `Doctor with ID ${doctorId} must belong to the same company`);
          }
        }
        for (const chemistId of chemistIds || []) {
          const chemist = await prisma.chemist.findUnique({ where: { id: chemistId } });
          if (!chemist) {
            return createResponse(404, false, `Chemist with ID ${chemistId} not found`);
          }
          const chemistCompany = await prisma.chemistCompany.findFirst({
            where: { chemistId, companyId },
          });
          if (!chemistCompany) {
            return createResponse(400, false, `Chemist with ID ${chemistId} must belong to the same company`);
          }
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
        const { id, isApproved, workTogether, isWorkTogetherConfirmed, notes, doctorIds, chemistIds } = data;

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

        if (typeof isApproved === "boolean") {
          updatedData.isApproved = isApproved;
        }
        if (typeof workTogether === "boolean") {
          updatedData.workTogether = workTogether;
        }
        if (typeof isWorkTogetherConfirmed === "boolean") {
          updatedData.isWorkTogetherConfirmed = isWorkTogetherConfirmed;
        }
        if (notes !== undefined) {
          updatedData.notes = notes;
        }

        // Update plan data first
        const updatedPlan = await prisma.dailyPlan.update({
          where: { id },
          data: updatedData,
        });

        // Update doctors if doctorIds is provided
        if (doctorIds) {
          await prisma.dailyPlanDoctor.deleteMany({ where: { dailyPlanId: id } });
          await prisma.dailyPlanDoctor.createMany({
            data: doctorIds.map((doctorId: number) => ({ dailyPlanId: id, doctorId })),
            skipDuplicates: true,
          });
        }

        // Update chemists if chemistIds is provided
        if (chemistIds) {
          await prisma.dailyPlanChemist.deleteMany({ where: { dailyPlanId: id } });
          await prisma.dailyPlanChemist.createMany({
            data: chemistIds.map((chemistId: number) => ({ dailyPlanId: id, chemistId })),
            skipDuplicates: true,
          });
        }

        // Fetch updated plan with relations
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

    deleteDailyPlan: async (_: any, { id }: { id: number }) => {
      try {
        if (!id) {
          return createResponse(400, false, "Plan ID is required");
        }

        const plan = await prisma.dailyPlan.findUnique({ where: { id } });
        if (!plan) {
          return createResponse(404, false, "Daily plan not found");
        }

        // Delete related entries first to maintain referential integrity
        await prisma.dailyPlanDoctor.deleteMany({ where: { dailyPlanId: id } });
        await prisma.dailyPlanChemist.deleteMany({ where: { dailyPlanId: id } });

        await prisma.dailyPlan.delete({ where: { id } });

        return createResponse(200, true, "Daily plan deleted successfully");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    approveAndConfirmDailyPlan: async (_: any, { id }: { id: number }) => {
  try {
    if (!id) {
      return createResponse(400, false, "Plan ID is required");
    }

    const plan = await prisma.dailyPlan.findUnique({ where: { id } });
    if (!plan) {
      return createResponse(404, false, "Daily plan not found");
    }

    const updatedPlan = await prisma.dailyPlan.update({
      where: { id },
      data: {
        isApproved: true,
        isWorkTogetherConfirmed: true,
      },
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

    return createResponse(200, true, "Daily plan approved and confirmed successfully", result);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
}

  },
};
