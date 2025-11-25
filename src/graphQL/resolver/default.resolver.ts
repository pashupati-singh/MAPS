import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";

const prisma = new PrismaClient();

export const DefaultResolver = {
  Query: {
    getDefaults: async (
      _: any,
      args: { page?: number; limit?: number },
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return createResponse(400, false, context?.authError || "Authorization Error");
        }

        if (!context.user && !context.company) {
          return createResponse(400, false, "User / Company authorization required");
        }

        const { userId, role, companyId: userCompanyId } = context.user || {};
        const companyId = context.company?.id || userCompanyId;

        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        const where: any = { companyId };

        // MR → only see own defaults
        if (role === "MR" && userId) {
          where.userId = userId;
        }
        // ABM / ADMIN / ZM → see all defaults for company (no extra filter)

        const page = args.page && args.page > 0 ? args.page : 1;
        const limit = args.limit && args.limit > 0 ? args.limit : 10;
        const skip = (page - 1) * limit;

        const total = await prisma.default.count({ where });
        const lastPage = Math.ceil(total / limit);

        const data = await prisma.default.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: "desc" },
        });

        return {
          code: 200,
          success: true,
          message: "Defaults fetched successfully",
          data,
          lastPage,
        };
      } catch (err: any) {
        console.error("Error in getDefaults:", err);
        return createResponse(500, false, err.message);
      }
    },

    getDefaultById: async (_: any, { id }: { id: number }, context: Context) => {
      try {
        if (!context || context.authError) {
          return createResponse(400, false, context?.authError || "Authorization Error");
        }

        if (!context.user && !context.company) {
          return createResponse(400, false, "User / Company authorization required");
        }

        const { userId, role, companyId: userCompanyId } = context.user || {};
        const companyId = context.company?.id || userCompanyId;

        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        if (!id) {
          return createResponse(400, false, "Default ID is required");
        }

        const record = await prisma.default.findUnique({
          where: { id },
        });

        if (!record) {
          return createResponse(404, false, "Default not found");
        }

        if (record.companyId !== companyId) {
          return createResponse(403, false, "You are not authorised to view this record");
        }

        // MR can only view own default row
        if (role === "MR" && userId && record.userId !== userId) {
          return createResponse(403, false, "You are not authorised to view this record");
        }

        return createResponse(200, true, "Default fetched successfully", record);
      } catch (err: any) {
        console.error("Error in getDefaultById:", err);
        return createResponse(500, false, err.message);
      }
    },

    getDefaultByUserId : async (_: any, __: any, context: Context) => {
      try {
        if (!context || context.authError) {
          return createResponse(400, false, context?.authError || "Authorization Error");
        }

        if (!context.user && !context.company) {
          return createResponse(400, false, "User / Company authorization required");
        }

        const companyId = context?.user?.companyId
        const userId = context?.user?.userId

        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        if (!userId) {
          return createResponse(400, false, "User ID is required");
        }

        const record = await prisma.default.findUnique({
          where: { id: userId },
        });

        if (!record) {
          return createResponse(404, false, "Default not found");
        }

        if (record.companyId !== companyId) {
          return createResponse(403, false, "You are not authorised to view this record");
        }

        if (record.userId !== userId) {
          return createResponse(403, false, "You are not authorised to view this record");
        }

        return createResponse(200, true, "Default fetched successfully", record);
      } catch (err: any) {
        console.error("Error in getDefaultByUserId:", err);
        return createResponse(500, false, err.message);
      }
    }
  },

  Mutation: {
    createDefault: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context || !context.user) {
          return createResponse(400, false, "Invalid token or user");
        }
        const companyId = context?.user?.companyId;
        const userId = context?.user?.userId;
        if (!companyId) {
          return createResponse(400, false, "Company ID is missing");
        }
        const { ta, da, ha, ca, oa } = data;

        const created = await prisma.default.create({
          data: {
            userId,
            companyId,
            ta,
            da,
            ha,
            ca,
            oa,
          },
        });

        return createResponse(201, true, "Default created successfully", created);
      } catch (err: any) {
        console.error("Error in createDefault:", err);
        return createResponse(500, false, err.message);
      }
    },

    updateDefault: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context || !context.user) {
          return createResponse(400, false, "Invalid token or user");
        }

        const { role, companyId: userCompanyId } = context.user;
        const companyId = context.company?.id || userCompanyId;

        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        if (role !== "ABM" && role !== "ADMIN") {
          return createResponse(400, false, "Only ABMs or ADMINs can update defaults");
        }

        const { id, userId, ta, da, ha, ca, oa } = data;

        if (!id) {
          return createResponse(400, false, "Default ID is required");
        }

        const record = await prisma.default.findUnique({ where: { id } });

        if (!record) {
          return createResponse(404, false, "Default not found");
        }

        if (record.companyId !== companyId) {
          return createResponse(403, false, "You are not authorised to update this record");
        }

        if (userId) {
          const user = await prisma.user.findFirst({
            where: { id: userId, companyId },
          });
          if (!user) {
            return createResponse(400, false, "Invalid user for this company");
          }
        }

        const updatedData: any = {};
        if (userId !== undefined) updatedData.userId = userId;
        if (ta !== undefined) updatedData.ta = ta;
        if (da !== undefined) updatedData.da = da;
        if (ha !== undefined) updatedData.ha = ha;
        if (ca !== undefined) updatedData.ca = ca;
        if (oa !== undefined) updatedData.oa = oa;

        const updated = await prisma.default.update({
          where: { id },
          data: updatedData,
        });

        return createResponse(200, true, "Default updated successfully", updated);
      } catch (err: any) {
        console.error("Error in updateDefault:", err);
        return createResponse(500, false, err.message);
      }
    },

    deleteDefault: async (_: any, { id }: { id: number }, context: Context) => {
      try {
        if (!context || !context.user) {
          return createResponse(400, false, "Invalid token or user");
        }

        const { role, companyId: userCompanyId } = context.user;
        const companyId = context.company?.id || userCompanyId;

        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        if (role !== "ABM" && role !== "ADMIN") {
          return createResponse(400, false, "Only ABMs or ADMINs can delete defaults");
        }

        if (!id) {
          return createResponse(400, false, "Default ID is required");
        }

        const record = await prisma.default.findUnique({
          where: { id },
        });

        if (!record) {
          return createResponse(404, false, "Default not found");
        }

        if (record.companyId !== companyId) {
          return createResponse(403, false, "You are not authorised to delete this record");
        }

        await prisma.default.delete({ where: { id } });

        return createResponse(200, true, "Default deleted successfully");
      } catch (err: any) {
        console.error("Error in deleteDefault:", err);
        return createResponse(500, false, err.message);
      }
    },
  },
};
