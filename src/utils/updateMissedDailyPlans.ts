import { PrismaClient, DailyPlanChemistStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function updateMissedDailyPlans(): Promise<void> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
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
    return; 
  }
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
  await prisma.dailyPlanDoctor.updateMany({
    where: {
      dailyPlanId: { in: pastDailyPlanIds },
      dcr: false,
      status: DailyPlanChemistStatus.pending, 
    },
    data: {
      status: DailyPlanChemistStatus.missed,
    },
  });
}
