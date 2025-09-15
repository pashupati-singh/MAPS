import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { isLocationWithinRange } from "../../utils/distance";

const prisma = new PrismaClient();

export const DailyCallReportResolver = {
  Query: {
    getDcrById: async (_: any, { id }: { id: number }) => {
      try {
        if (!id) return createResponse(400, false, "DCR ID is required");

        const dcr = await prisma.dailyCallReport.findUnique({ where: { id } });
        if (!dcr) return createResponse(404, false, "DCR not found");

        return createResponse(200, true, "DCR fetched successfully", dcr);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getDcrsByMr: async (_: any, { mrId }: { mrId: number }) => {
      try {
        if (!mrId) return createResponse(400, false, "MR ID is required");

        const dcrs = await prisma.dailyCallReport.findMany({ where: { mrId } });
        return createResponse(200, true, "DCRs fetched successfully", dcrs);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getDcrsByDoctor: async (_: any, { doctorId }: { doctorId: number }) => {
      try {
        if (!doctorId) return createResponse(400, false, "Doctor ID is required");

        const dcrs = await prisma.dailyCallReport.findMany({ where: { doctorId } });
        return createResponse(200, true, "DCRs fetched successfully", dcrs);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getDcrsByChemist: async (_: any, { chemistId }: { chemistId: number }) => {
      try {
        if (!chemistId) return createResponse(400, false, "Chemist ID is required");

        const dcrs = await prisma.dailyCallReport.findMany({ where: { chemistId } });
        return createResponse(200, true, "DCRs fetched successfully", dcrs);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getDcrsByDailyPlan: async (_: any, { dailyPlanId }: { dailyPlanId: number }) => {
      try {
        if (!dailyPlanId) return createResponse(400, false, "DailyPlan ID is required");

        const dcrs = await prisma.dailyCallReport.findMany({ where: { dailyPlanId } });
        return createResponse(200, true, "DCRs fetched successfully", dcrs);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },

  Mutation: {
    createDcr: async (_: any, { data }: any) => {
  try {
    const {
      dailyPlanId,
      mrId,
      abmId,
      doctorId,
      chemistId,
      typeOfReport,
      reportStartTime,
      reportEndTime,
      products,
      remarks,
      latitude,
      longitude,
    } = data;

    if (!mrId && !abmId) {
      return createResponse(400, false, "Either MR ID or ABM ID is required");
    }

    const dailyPlan = await prisma.dailyPlan.findUnique({
      where: { id: dailyPlanId },
      include: { doctors: { include: { doctor: { include: { address: true } } } }, chemists: { include: { chemist: { include: { address: true } } } } },
    });
    if (!dailyPlan) return createResponse(404, false, "Daily plan not found");

    if (doctorId && chemistId) {
      return createResponse(400, false, "Cannot assign both doctor and chemist");
    }

    // ✅ Doctor validation
    let targetLat: number | null = null;
    let targetLon: number | null = null;

    if (doctorId) {
      const doctorEntry = dailyPlan.doctors.find(d => d.doctorId === doctorId);
      if (!doctorEntry) return createResponse(400, false, "Doctor not in this daily plan");

      const doctor = doctorEntry.doctor;
      if (!doctor.address || doctor.address.latitude === null || doctor.address.longitude === null) {
        return createResponse(400, false, "Doctor has no valid address coordinates");
      }

      targetLat = doctor.address.latitude;
      targetLon = doctor.address.longitude;
    }

    // ✅ Chemist validation
    if (chemistId) {
      const chemistEntry = dailyPlan.chemists.find(c => c.chemistId === chemistId);
      if (!chemistEntry) return createResponse(400, false, "Chemist not in this daily plan");

      const chemist = chemistEntry.chemist;
      if (!chemist.address || chemist.address.latitude === null || chemist.address.longitude === null) {
        return createResponse(400, false, "Chemist has no valid address coordinates");
      }

      targetLat = chemist.address.latitude;
      targetLon = chemist.address.longitude;
    }

    // ✅ ABM validation
    if (abmId && dailyPlan.abmId !== abmId) {
      return createResponse(403, false, "ABM not assigned to this daily plan");
    }

    // ✅ Calculate duration
    const [sh, sm] = reportStartTime.split(":").map(Number);
    const [eh, em] = reportEndTime.split(":").map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    if (duration <= 0) return createResponse(400, false, "Invalid report times");

    // ✅ Location validation (50m rule)
    if (latitude && longitude && targetLat && targetLon) {
      const inRange = isLocationWithinRange(latitude, longitude, targetLat, targetLon, 50);
      if (!inRange) {
        return createResponse(400, false, "You are not at the doctor's/chemist's location (distance > 50m)");
      }
    }

    const dcr = await prisma.dailyCallReport.create({
      data: {
        dailyPlanId,
        mrId,
        abmId,
        doctorId,
        chemistId,
        typeOfReport,
        reportDate: dailyPlan.planDate,
        reportStartTime,
        reportEndTime,
        duration,
        products,
        remarks,
        latitude,
        longitude,
      },
    });

    return createResponse(201, true, "DCR created successfully", dcr);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},
  },
};
