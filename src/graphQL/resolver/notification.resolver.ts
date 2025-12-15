import { PrismaClient } from "@prisma/client";
import { Context } from "../../context";
import { createResponse } from "../../utils/response";
import { toUtcMidnight } from "../../utils/ConvertUTCToIST";

const prisma = new PrismaClient();
export const NotificationResolver = {

  Notification: {
    date: (parent: any) => (parent.date ? new Date(parent.date).toISOString() : null),
    notifyCreatedBy: (parent: any) => parent.notifyCreatedByUser ?? null,
  },

  Query: {
    getNotifications: async (
      _: any,
      args: { page?: number; limit?: number; filter?: { type?: string; startDate?: string; endDate?: string } },
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return {
            code: 400,
            success: false,
            message: context?.authError || "Authorization Error",
            data: [],
            lastPage: 0,
          };
        }

        const userId = context.user?.userId;
        if (!userId) {
          return { code: 400, success: false, message: "Invalid user", data: [], lastPage: 0 };
        }

        const page = args.page && args.page > 0 ? args.page : 1;
        const limit = args.limit && args.limit > 0 ? args.limit : 10;

        const where: any = {
          userToNotify: userId,
        };

        const filter = args.filter;

        if (filter?.type) {
          where.type = { equals: filter.type, mode: "insensitive" };
        }

        if (filter?.startDate || filter?.endDate) {
          where.date = {};
          if (filter.startDate) where.date.gte = toUtcMidnight(filter.startDate);
          if (filter.endDate) where.date.lte = toUtcMidnight(filter.endDate);
        }

        const total = await prisma.notification.count({ where });
        const lastPage = Math.ceil(total / limit) || 1;

        const data = await prisma.notification.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ date: "desc" }, { id: "desc" }],
          include: {
            NotifyCreatedBy: {
              select: { id: true, name: true, phone: true, email: true, role: true },
            },
          },
        });

        return { code: 200, success: true, message: "Notifications fetched successfully", data, lastPage };
      } catch (err: any) {
        return { code: 500, success: false, message: err.message, data: [], lastPage: 0 };
      }
    },

    notificationById: async (_: any, args: { id: number }, context: Context) => {
      try {
        if (!context || context.authError) return createResponse(400, false, context?.authError || "Authorization Error");

        const userId = context.user?.userId;
        if (!userId) return createResponse(400, false, "Invalid user");

        const notification = await prisma.notification.findFirst({
          where: {
            id: args.id,
            userToNotify: userId,
          },
          include: {
            NotifyCreatedBy: {
              select: { id: true, name: true, phone: true, email: true, role: true },
            },
          },
        });

        if (!notification) return createResponse(404, false, "Notification not found");

        return createResponse(200, true, "Notification fetched successfully", notification);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },

  Mutation: {
    markNotificationsRead: async (_: any, { data }: { data: { ids: number[] } }, context: Context) => {
      try {
        if (!context || context.authError) {
          return { code: 400, success: false, message: context?.authError || "Authorization Error", updatedCount: 0 };
        }

        const userId = context.user?.userId;
        if (!userId) return { code: 400, success: false, message: "Invalid user", updatedCount: 0 };

        const ids = Array.isArray(data?.ids) ? data.ids.filter((x) => typeof x === "number") : [];
        if (ids.length === 0) return { code: 400, success: false, message: "ids are required", updatedCount: 0 };

        const result = await prisma.notification.updateMany({
          where: {
            id: { in: ids },
            userToNotify: userId,
          },
          data: { read: true },
        });

        return {
          code: 200,
          success: true,
          message: "Notifications marked as read",
          updatedCount: result.count,
        };
      } catch (err: any) {
        return { code: 500, success: false, message: err.message, updatedCount: 0 };
      }
    },
  },
};
