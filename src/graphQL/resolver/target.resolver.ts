import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";

const prisma = new PrismaClient();

export const TargetResolver = {
  Query: {
    // --- Sales (general) ---
    getMrTargets: async (_: any, { userId }: any) => {
      try {
        const targets = await prisma.target.findMany({ where: { userId } });
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
        const targets = await prisma.target.findMany({ where: { userId: { in: mrIds } } });

        return createResponse(200, true, "ABM targets fetched", targets);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getCompanyTargets: async (_: any, { companyId }: any) => {
      try {
        const targets = await prisma.target.findMany({ where: { companyId } });
        return createResponse(200, true, "Company targets fetched", targets);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    // --- Product-specific ---
    getMrProductTargets: async (_: any, { userId }: any) => {
      try {
        const targets = await prisma.productTarget.findMany({ where: { userId } });
        return createResponse(200, true, "MR product targets fetched", targets);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getAbmProductTargets: async (_: any, { abmId, productId }: any) => {
      try {
        const abm = await prisma.user.findUnique({
          where: { id: abmId },
          include: { mrs: true },
        });
        if (!abm) return createResponse(404, false, "ABM not found");

        const mrIds = abm.mrs.map((mr) => mr.id);
        const targets = await prisma.productTarget.findMany({
          where: { userId: { in: mrIds }, productId },
        });

        return createResponse(200, true, "ABM product targets fetched", targets);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getCompanyProductTargets: async (_: any, { companyId, productId }: any) => {
      try {
        const targets = await prisma.productTarget.findMany({
          where: { companyId, productId },
        });
        return createResponse(200, true, "Company product targets fetched", targets);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },

  Mutation: {
    createTarget: async (_: any, { data }: any) => {
      try {
        const target = await prisma.target.create({ data });
        return createResponse(201, true, "Target created successfully", target);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    createProductTarget: async (_: any, { data }: any) => {
      try {
        const target = await prisma.productTarget.create({ data });
        return createResponse(201, true, "Product target created successfully", target);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
