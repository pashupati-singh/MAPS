// src/utils/updateMissedDailyPlans.ts
import { PrismaClient, DailyPlanChemistStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Marks DailyPlanChemist & DailyPlanDoctor as 'missed'
 * for all past DailyPlans where dcr = false and status = 'pending'.
 */
export async function updateMissedDailyPlans(): Promise<void> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 1. Get all past DailyPlan IDs (planDate < today)
  const pastDailyPlans = await prisma.dailyPlan.findMany({
    where: {
      planDate: {
        lt: startOfToday,
      },
    },
    select: { id: true },
  });

  const pastDailyPlanIds = pastDailyPlans.map((p) => p.id);

  if (pastDailyPlanIds.length === 0) {
    return; // nothing to update
  }

  // 2. Update DailyPlanChemist where dcr = false AND status = 'pending'
  await prisma.dailyPlanChemist.updateMany({
    where: {
      dailyPlanId: { in: pastDailyPlanIds },
      dcr: false,
      status: DailyPlanChemistStatus.pending,
    },
    data: {
      status: DailyPlanChemistStatus.missed,
    },
  });

  // 3. Update DailyPlanDoctor where dcr = false AND status = 'pending'
  await prisma.dailyPlanDoctor.updateMany({
    where: {
      dailyPlanId: { in: pastDailyPlanIds },
      dcr: false,
      status: DailyPlanChemistStatus.pending, // same enum as in schema
    },
    data: {
      status: DailyPlanChemistStatus.missed,
    },
  });
}
