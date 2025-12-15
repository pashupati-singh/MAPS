import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CreateNotificationArgs = {
  tableId: number;
  type: string;
  title: string;
  message: string;
  date: string | Date;
  userToNotify: number;
  notifyCreatedBy?: number | null;
};

const toDateOnly = (d: string | Date) =>
  d instanceof Date ? d : new Date(`${d}T00:00:00.000Z`);

export async function createNotification(args: CreateNotificationArgs) {
  return prisma.notification.create({
    data: {
      tableId: args.tableId,
      type: args.type,
      title: args.title,
      message: args.message,
      date: toDateOnly(args.date),
      userToNotify: args.userToNotify,
      notifyCreatedBy: args.notifyCreatedBy ?? null,
      read: false,
    },
  });
}
