import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";

const prisma = new PrismaClient();

export const TargetResolver = {
  Query: {
    getMrTargets: async (_: any, __: any, context: Context) => {
      try {
        if (!context?.user) return createResponse(401, false, "Unauthorized");
        const targets = await prisma.target.findMany({
          where: { userId: context.user.id },
        });
        return createResponse(200, true, "MR targets fetched", targets);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getAbmTargets: async (_: any, { abmId }: any) => {
      try {
        const abm = await prisma.user.findUnique({
          where: { id: abmId },
          include: { mrs: true },
        });
        if (!abm) return createResponse(404, false, "ABM not found");

        const mrIds = abm.mrs.map((mr) => mr.id);
        const targets = await prisma.target.findMany({
          where: { userId: { in: mrIds } },
        });

        return createResponse(200, true, "ABM targets fetched", targets);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getCompanyTargets: async (_: any, __: any, context: Context) => {
      try {
        if (!context?.company) return createResponse(400, false, "Company not found");
        const targets = await prisma.target.findMany({
          where: { companyId: context.company.id },
        });
        return createResponse(200, true, "Company targets fetched", targets);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },

  Mutation: {
    createTarget: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context?.user || !context.company)
          return createResponse(401, false, "Unauthorized");

        const { doctorId, chemistId, year, month, quarter, halfYear } = data;

        if (!doctorId && !chemistId) {
          return createResponse(400, false, "Either doctorId or chemistId is required");
        }
        if (doctorId && chemistId) {
          return createResponse(400, false, "Cannot assign both doctor and chemist");
        }

        const existing = await prisma.target.findFirst({
          where: {
            companyId: context.company.id,
            userId: context.user.id,
            doctorId: doctorId ?? undefined,
            chemistId: chemistId ?? undefined,
          },
        });
        if (existing) {
          return createResponse(409, false, "Target already exists for this combination");
        }

        const target = await prisma.target.create({
          data: {
            companyId: context.company.id,
            userId: context.user.id,
            doctorId,
            chemistId,
            year,
            month,
            quarter,
            halfYear,
          },
        });

        return createResponse(201, true, "Target created successfully", target);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    updateTarget: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context?.user || !context.company)
          return createResponse(401, false, "Unauthorized");

        const { id, doctorId, chemistId, year, month, quarter, halfYear } = data;

        const existing = await prisma.target.findUnique({ where: { id } });
        if (!existing) return createResponse(404, false, "Target not found");

        if (existing.userId !== context.user.id) {
          return createResponse(403, false, "You can only update your own targets");
        }

        if (doctorId && chemistId) {
          return createResponse(400, false, "Cannot assign both doctor and chemist");
        }

        const duplicate = await prisma.target.findFirst({
          where: {
            companyId: context.company.id,
            userId: context.user.id,
            doctorId: doctorId ?? existing.doctorId ?? undefined,
            chemistId: chemistId ?? existing.chemistId ?? undefined,
            year: year ?? existing.year,
            month: month ?? existing.month,
            quarter: quarter ?? existing.quarter,
            halfYear: halfYear ?? existing.halfYear,
            NOT: { id },
          },
        });
        if (duplicate) {
          return createResponse(409, false, "Target already exists for this combination");
        }

        const updated = await prisma.target.update({
          where: { id },
          data: {
            doctorId: doctorId ?? existing.doctorId,
            chemistId: chemistId ?? existing.chemistId,
            year: year ?? existing.year,
            month: month ?? existing.month,
            quarter: quarter ?? existing.quarter,
            halfYear: halfYear ?? existing.halfYear,
          },
        });

        return createResponse(200, true, "Target updated successfully", updated);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
