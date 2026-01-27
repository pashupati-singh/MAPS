import { PrismaClient } from "@prisma/client";
import { Context } from "../../context";
import { createResponse } from "../../utils/response";
import { toUtcMidnight } from "../../utils/ConvertUTCToIST";

const prisma = new PrismaClient();

const MONTH_INDEX: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function getDaysInMonth(month: string, year: number) {
  const idx = MONTH_INDEX[String(month).toLowerCase()];
  if (idx === undefined) return 0;
  return new Date(Date.UTC(year, idx + 1, 0)).getUTCDate();
}

function ymdKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const CompanyCalendarResolver = {
  DateWiseCalendar: {
    date: (parent: any) => (parent.date ? new Date(parent.date).toISOString() : null),
  },

  CompanyCalendar: {
    daysInMonth: (parent: any) => {
      if (!parent?.month || !parent?.year) return 0;
      return getDaysInMonth(parent.month, parent.year);
    },
    inComplete: (parent: any) => {
      if (!parent?.month || !parent?.year) return false;
      const days = getDaysInMonth(parent.month, parent.year);
      const sum = (parent.totalOffDays || 0) + (parent.totalWorkingDate || 0);
      return sum < days ? false : true;
    },
  },

  Query: {
   getCompanyCalendar: async (_: any, args: { year: number }, context: Context) => {
  try {
    if (!context || context.authError) {
      return createResponse(400, false, context?.authError || "Authorization Error");
    }

    const roleRaw = context.user?.role;
    const role = roleRaw ? String(roleRaw).toUpperCase() : "";
    const userId = context.user?.userId;

    const companyId =
      context.company?.id || (role === "COMPANY" ? userId : context.user?.companyId);

    if (!companyId) {
      return createResponse(400, false, "Company authorization required");
    }

    const year = Number(args.year);
    if (!year || year < 1900) {
      return createResponse(400, false, "Invalid year");
    }

    const data = await prisma.companyCalendar.findMany({
      where: { companyId, year },
      orderBy: { id: "desc" },
      include: { DateWiseCalendar: { orderBy: { date: "asc" } } },
    });
    return {
      code: 200,
      success: true,
      message: "Company calendar fetched successfully",
      data 
    }
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},

  },

  Mutation: {
    upsertCompanyCalendars: async (_: any, { data }: { data: any[] }, context: Context) => {
      try {
        if (!context || context.authError) {
          return {
            code: 400,
            success: false,
            message: context?.authError || "Authorization Error",
            data: [],
          };
        }

        const roleRaw = context.user?.role;
        const role = roleRaw ? String(roleRaw).toUpperCase() : "";
        const userId = context.user?.userId;

        const companyId =
          context.company?.id ||
          (role === "COMPANY" ? userId : context.user?.companyId);

        if (!companyId) {
          return { code: 400, success: false, message: "Company authorization required", data: [] };
        }

        if (!Array.isArray(data) || data.length === 0) {
          return { code: 400, success: false, message: "data array is required", data: [] };
        }

        const createdOrUpdated: any[] = [];

        for (const item of data) {
          const month = String(item.month).toLowerCase();
          const year = Number(item.year);

          if (!MONTH_INDEX.hasOwnProperty(month)) {
            throw new Error(`Invalid month: ${item.month}`);
          }
          if (!year || year < 1900) {
            throw new Error(`Invalid year: ${item.year}`);
          }

          const monthIdx = MONTH_INDEX[month];
          const start = new Date(Date.UTC(year, monthIdx, 1));
          const endExclusive = new Date(Date.UTC(year, monthIdx + 1, 1));

          // 1) find or create CompanyCalendar
          let calendar = await prisma.companyCalendar.findFirst({
            where: { companyId, month: month as any, year },
            orderBy: { id: "desc" },
            select: { id: true },
          });

          if (!calendar) {
            calendar = await prisma.companyCalendar.create({
              data: {
                companyId,
                month: month as any,
                year,
                totalWorkingDate: 0,
                totalOffDays: 0,
              },
              select: { id: true },
            });
          }

          const companyCalendarId = calendar.id;

          // 2) Load existing DateWiseCalendar rows for this month
          const existing = await prisma.dateWiseCalendar.findMany({
            where: {
              companyId,
              date: { gte: start, lt: endExclusive },
            },
            select: { id: true, date: true },
          });

          const existingMap = new Map<string, { id: number }>();
          for (const e of existing) {
            if (e.date) existingMap.set(ymdKey(new Date(e.date)), { id: e.id });
          }

          const incoming: any[] = Array.isArray(item.dateWiseCalendar) ? item.dateWiseCalendar : [];

          // 3) Upsert each date row (update if exists else create)
          for (const row of incoming) {
            const dateStr = row?.date;
            const type = row?.type;

            if (!dateStr) throw new Error(`date is required in dateWiseCalendar for ${month}-${year}`);
            if (type !== "on" && type !== "off") throw new Error(`Invalid day type: ${type} (must be on/off)`);

            const d = toUtcMidnight(dateStr); // dd/mm/yyyy -> Date UTC midnight
            if (!(d instanceof Date) || isNaN(d.getTime())) {
              throw new Error(`Invalid date format: ${dateStr} (expected dd/mm/yyyy)`);
            }

            // ensure date belongs to month/year
            if (d.getUTCFullYear() !== year || d.getUTCMonth() !== monthIdx) {
              throw new Error(`Date ${dateStr} does not match month/year ${month}/${year}`);
            }

            // --- ✅ reason handling ---
            const hasReason = Object.prototype.hasOwnProperty.call(row, "reason");
            let reasonValue: string | null = null;

            if (hasReason) {
              const raw = row.reason;
              const trimmed = raw === null || raw === undefined ? "" : String(raw).trim();
              reasonValue = trimmed.length > 0 ? trimmed : null;
            }

            const key = ymdKey(d);
            const hit = existingMap.get(key);

            if (hit) {
              const updateData: any = {
                companyId,
                companyCalendarId,
                date: d,
                type,
              };

              // only update reason if client sent it
              if (hasReason) updateData.reason = reasonValue;

              await prisma.dateWiseCalendar.update({
                where: { id: hit.id },
                data: updateData,
              });
            } else {
              await prisma.dateWiseCalendar.create({
                data: {
                  companyId,
                  companyCalendarId,
                  date: d,
                  type,
                  reason: hasReason ? reasonValue : null,
                },
              });
            }
          }

          // 4) Recalculate totals
          const totalWorkingDate = await prisma.dateWiseCalendar.count({
            where: { companyCalendarId, type: "on" as any },
          });

          const totalOffDays = await prisma.dateWiseCalendar.count({
            where: { companyCalendarId, type: "off" as any },
          });

          // 5) Update totals
          await prisma.companyCalendar.update({
            where: { id: companyCalendarId },
            data: { totalWorkingDate, totalOffDays },
          });

          // 6) Return fresh calendar
          const fresh = await prisma.companyCalendar.findUnique({
            where: { id: companyCalendarId },
            include: { DateWiseCalendar: { orderBy: { date: "asc" } } },
          });

          if (fresh) createdOrUpdated.push(fresh);
        }

        return { code: 201, success: true, message: "Company calendars saved successfully", data: createdOrUpdated };
      } catch (err: any) {
        return { code: 500, success: false, message: err.message, data: [] };
      }
    },
  },
};
