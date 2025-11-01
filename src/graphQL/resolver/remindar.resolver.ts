import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";
import { istTodayUtcRange, toUtcMidnight } from "../../utils/ConvertUTCToIST";

const prisma = new PrismaClient();



export const RemindarResolver = {
  Query: {
    getRemindars: async (_: any, args: { page?: number; limit?: number }, context: Context) => {
      try {
        if (!context || context.authError) {
          return { code: 400, success: false, message: context?.authError || "Authorization Error", data: [], lastPage: 0 };
        }
        const companyId = context.user?.companyId;
        if (!companyId) return { code: 400, success: false, message: "Company authorization required", data: [], lastPage: 0 };
        if(!context.user?.userId) return { code: 400, success: false, message: "User authorization required", data: [], lastPage: 0 };
        const  userId  = context.user?.userId;
        const page = args.page && args.page > 0 ? args.page : 1;
        const limit = args.limit && args.limit > 0 ? args.limit : 10;

        const total = await prisma.remindar.count({
          where: { userId, User: { companyId } },
        });
        const lastPage = Math.max(1, Math.ceil(total / limit));

        const rows = await prisma.remindar.findMany({
          where: { userId, User: { companyId } },
          orderBy: { id: "desc" },                
          skip: (page - 1) * limit,
          take: limit,
        });

        return { code: 200, success: true, message: "Remindars fetched", data: rows, lastPage };
      } catch (err: any) {
        return { code: 500, success: false, message: err.message, data: [], lastPage: 0 };
      }
    },

    getTodayRemindars: async (_: any, __: any, context: Context) => {
      try {
        if (!context || context.authError)
          return createResponse(400, false, context?.authError || "Authorization Error");

        const companyId = context.user?.companyId;
        if (!companyId)
          return createResponse(400, false, "Company authorization required");
        if (!context.user?.userId)
          return createResponse(400, false, "User authorization required");

        const userId = context.user.userId;

        const { start, end } = istTodayUtcRange();
        const rows = await prisma.remindar.findMany({
          where: {
            userId,
            remindAt: {
              gte: start,
              lt: end
            },
          },
          orderBy: { remindAt: "asc" },
        });

        return {
          code: 200,
          success: true,
          message: "Today's remindars fetched",
          data: rows,
          lastPage: 1,
        };
      } catch (err: any) {
        return {
          code: 500,
          success: false,
          message: err.message,
          data: [],
          lastPage: 0,
        };
      }
    },

    getRemindarsByDate: async (_: any, {date }: { date: string }, context: Context) => {
      try {
        if (!context || context.authError) return createResponse(400, false, context?.authError || "Authorization Error");
        const companyId = context.user?.companyId;
        if (!companyId) return createResponse(400, false, "Company authorization required");
        if(!context.user?.userId) return createResponse(400, false, "User authorization required");

        const userId = context.user?.userId;
        const start = toUtcMidnight(date);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

        const rows = await prisma.remindar.findMany({
          where: { userId, 
          remindAt: { gte: start, lt: end } 
        },
          orderBy: { remindAt: "asc" },
        });

        return { code: 200, success: true, message: "Date-wise remindars fetched", data: rows, lastPage: 1 };
      } catch (err: any) {
        return { code: 500, success: false, message: err.message, data: [], lastPage: 0 };
      }
    },
  },

  Mutation: {
    createRemindar: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context || context.authError) return createResponse(400, false, context?.authError || "Authorization Error");
        const companyId = context.user?.companyId;
        if (!companyId) return createResponse(400, false, "Company authorization required");

        const userId = data.userId ?? context.user?.userId;
        if (!userId) return createResponse(400, false, "userId is required");

        const remindAt = toUtcMidnight(data.date); 
        console.log("🚀 ~ file: remindar.resolver.ts ~ line 64 ~ remindAt", remindAt)
        const row = await prisma.remindar.create({
          data: {
            userId,
            heading: data.heading,
            message: data.message,
            remindAt,
          },
          include: {User : true}
        });

        return createResponse(201, true, "Remindar created", row);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    updateRemindar: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context || context.authError) return createResponse(400, false, context?.authError || "Authorization Error");
        const companyId = context.user?.companyId;
        if (!companyId) return createResponse(400, false, "Company authorization required");
        if (!data?.id) return createResponse(400, false, "id is required");

        const existing = await prisma.remindar.findFirst({
          where: { id: data.id, User: { companyId } },
        });
        if (!existing) return createResponse(404, false, "Remindar not found");

        const updateData: any = {
          heading: data.heading ?? undefined,
          message: data.message ?? undefined,
        };
        if (data.date) updateData.remindAt = toUtcMidnight(data.date); 

        const row = await prisma.remindar.update({
          where: { id: data.id },
          data: updateData,
        });

        return createResponse(200, true, "Remindar updated", row);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    deleteRemindar: async (_: any, { id }: { id: number }, context: Context) => {
      try {
        if (!context || context.authError) return createResponse(400, false, context?.authError || "Authorization Error");
        const companyId = context.user?.companyId;
        if (!companyId) return createResponse(400, false, "Company authorization required");
        const row = await prisma.remindar.findFirst({ where: { id, User: { companyId } } });
        if (!row) return createResponse(404, false, "Remindar not found");

        await prisma.remindar.delete({ where: { id } });
        return createResponse(200, true, "Remindar deleted", { id });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
