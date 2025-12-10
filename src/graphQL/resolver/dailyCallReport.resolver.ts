import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { isLocationWithinRange } from "../../utils/distance";
import { Context } from "../../context";

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

        const dcrs = await prisma.dailyCallReport.findMany({ where: { doctorCompanyId: doctorId } });
        return createResponse(200, true, "DCRs fetched successfully", dcrs);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getDcrsByChemist: async (_: any, { chemistId }: { chemistId: number }) => {
      try {
        if (!chemistId) return createResponse(400, false, "Chemist ID is required");

        const dcrs = await prisma.dailyCallReport.findMany({ where: { chemistCompanyId: chemistId } });
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

    getDcrsBySingleDetailsOfCheOrDoc : async (_: any, { dailyPlanId  , dailyPlanDoctorId , dailyPlanChemistId , doctorCompanyId , chemistCompanyId }: { dailyPlanId: number , mrId: number , dailyPlanDoctorId?: number , dailyPlanChemistId?: number , doctorCompanyId?: number , chemistCompanyId?: number } , context: Context) => {
      try {
        if(!context) return createResponse(400, false, "Token missing or invalid");
        if(!context.user) return createResponse(400, false, "User not found");
        if (!dailyPlanId) return createResponse(400, false, "DailyPlan is required");
        if(!doctorCompanyId && !chemistCompanyId) return createResponse(400, false, "Doctor or Chemist is required");
        if(!dailyPlanDoctorId && !dailyPlanChemistId) return createResponse(400, false, "Daily Plan of Doctor or Chemist is required");
        const { userId , role } = context.user;
        const where: any = { dailyPlanId };
        if(role === "MR") where.mrId = userId;
        if(role === "ABM") where.abmId = userId;
        if(doctorCompanyId ) where.doctorCompanyId = doctorCompanyId;
        if(chemistCompanyId ) where.chemistCompanyId = chemistCompanyId;
        if(dailyPlanDoctorId ) where.dailyPlanDoctorId = dailyPlanDoctorId;
        if(dailyPlanChemistId ) where.dailyPlanChemistId = dailyPlanChemistId;
        
        const dcrs = await prisma.dailyCallReport.findMany({ where: where });
        return createResponse(200, true, "DCRs fetched successfully", dcrs);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
  },
},

  Mutation: {
 createDcr: async (_: any, { data }: any, context: Context) => {
  try {
    const {
      dailyPlanId,
      abmId,
      dailyPlanDoctorId,
      dailyPlanChemistId,
      doctorCompanyId,
      chemistCompanyId,
      typeOfReport,
      reportStartTime,
      reportEndTime,
      products,
      remarks,
      latitude,
      longitude,
    } = data;

    if (!context) return createResponse(400, false, "Token missing or invalid");
    if (!context.user) return createResponse(400, false, "User not found");

    const { userId, role } = context.user;
    const mrId = userId;
    if (role !== "MR") return createResponse(403, false, "Only MRs can create DCRs");

    const companyId = context.company?.id;
    if (!companyId) return createResponse(400, false, "Company ID is missing");

    if (!latitude || !longitude)
      return createResponse(400, false, "Location is required");

    if (!doctorCompanyId && !chemistCompanyId)
      return createResponse(400, false, "Either doctorCompanyId or chemistCompanyId is required");

    if (doctorCompanyId && chemistCompanyId)
      return createResponse(400, false, "Cannot assign both doctor and chemist in one DCR");

    const dailyPlan = await prisma.dailyPlan.findUnique({
      where: { id: dailyPlanId , mrId : context.user.userId },
      include: {
        doctors: {
          where: {
            ...(dailyPlanDoctorId && { id: dailyPlanDoctorId }),
            ...(doctorCompanyId && { doctorCompanyId }),
          },
          include: {
            DoctorCompany: {
              include: {
                doctor: { include: { address: true } },
              },
            },
          },
        },
        chemists: {
          where: {
            ...(dailyPlanChemistId && { id: dailyPlanChemistId }),
            ...(chemistCompanyId && { chemistCompanyId }),
          },
          include: {
            ChemistCompany: {
              include: {
                chemist: { include: { address: true } },
              },
            },
          },
        },
      },
    });

    if (!dailyPlan) return createResponse(404, false, "Daily plan not found");

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const planDate = new Date(dailyPlan.planDate);
    const planDay = new Date(planDate.getFullYear(), planDate.getMonth(), planDate.getDate());

    if (planDay.getTime() !== today.getTime()) {
      return createResponse(400, false, "Daily plan not found for today");
    }

    if (dailyPlan.workTogether && !dailyPlan.abmId)
      return createResponse(400, false, "ABM is required since workTogether is true");

    if (abmId && dailyPlan.abmId && abmId !== dailyPlan.abmId)
      return createResponse(403, false, "ABM not assigned to this daily plan");

    let targetLat: number | null = null;
    let targetLon: number | null = null;

    if (doctorCompanyId) {
      const doctorEntry = dailyPlan.doctors[0];
      if (!doctorEntry)
        return createResponse(400, false, "Doctor not found in this daily plan");

      const doctor = doctorEntry.DoctorCompany?.doctor;
      if (
        !doctor ||
        !doctor.address ||
        doctor.address.latitude === null ||
        doctor.address.longitude === null
      )
        return createResponse(400, false, "Doctor has no valid address coordinates");

      targetLat = doctor.address.latitude;
      targetLon = doctor.address.longitude;
    }

    if (chemistCompanyId) {
      const chemistEntry = dailyPlan.chemists[0];
      if (!chemistEntry)
        return createResponse(400, false, "Chemist not found in this daily plan");

      const chemist = chemistEntry.ChemistCompany?.chemist;
      if (
        !chemist ||
        !chemist.address ||
        chemist.address.latitude === null ||
        chemist.address.longitude === null
      )
        return createResponse(400, false, "Chemist has no valid address coordinates");

      targetLat = chemist.address.latitude;
      targetLon = chemist.address.longitude;
    }

    if (latitude && longitude && targetLat && targetLon) {
      const inRange = isLocationWithinRange(latitude, longitude, targetLat, targetLon, 50);
      if (!inRange) return createResponse(400, false, "You are not at the correct location");
    }

    const [sh, sm] = reportStartTime.split(":").map(Number);
    const [eh, em] = reportEndTime.split(":").map(Number);
    const duration = eh * 60 + em - (sh * 60 + sm);
    if (duration <= 0) return createResponse(400, false, "Invalid report times");

    const dcr = await prisma.dailyCallReport.create({
      data: {
        dailyPlanId,
        dailyPlanDoctorId,
        dailyPlanChemistId,
        doctorCompanyId,
        chemistCompanyId,
        mrId,
        abmId,
        typeOfReport,
        reportDate: dailyPlan.planDate,
        reportStartTime,
        reportEndTime,
        duration,
        products,
        remarks,
        mrReportCompleted: true,
        latitudeMR: latitude,
        longitudeMR: longitude,
      },
    });

    if (!abmId) {
      if (dailyPlanDoctorId) {
        await prisma.dailyPlanDoctor.update({
          where: { id: dailyPlanDoctorId },
          data: { dcr: true , status : "completed" },
        });
      } else if (dailyPlanChemistId) {
        await prisma.dailyPlanChemist.update({
          where: { id: dailyPlanChemistId },
          data: { dcr: true , status : "completed" },
        });
      }
    }

    return createResponse(201, true, "DCR created successfully", dcr);
  } catch (err: any) {
    console.error("Error in createDcr:", err);
    return createResponse(500, false, err.message);
  }
},


async updateDcrByAbm(_: any, { data }: any, context: Context) {
  try {
    if (!context?.user) {
      return createResponse(400, false, "User not authenticated");
    }

    const { userId, role } = context.user;
    if (role !== "ABM") {
      return createResponse(400, false, "Only ABM can update DCR");
    }

    const { dcrId, latitude, longitude, reportStartTime, reportEndTime, remarks, products } = data;

    if (!dcrId) {
      return createResponse(400, false, "DCR ID is required");
    }

    if (!latitude || !longitude) {
      return createResponse(400, false, "Location is required");
    }

    // 🧩 Fetch existing DCR with relations
    const existing = await prisma.dailyCallReport.findUnique({
      where: { id: dcrId },
      include: {
        dailyPlan: true,
      },
    });

    if (!existing) {
      return createResponse(404, false, "DCR not found");
    }

    if (!existing.abmId || existing.abmId !== userId) {
      return createResponse(403, false, "You are not assigned to this DCR");
    }

    // 🧭 Validate ABM is near MR’s location (50m radius)
    if (existing.latitudeMR && existing.longitudeMR) {
      const inRange = isLocationWithinRange(
        latitude,
        longitude,
        existing.latitudeMR,
        existing.longitudeMR,
        50
      );
      if (!inRange) {
        return createResponse(400, false, "You are not at MR's location");
      }
    }

    // 🕒 Validate time and duration if provided
    let duration = existing.duration;
    if (reportStartTime && reportEndTime) {
      const [sh, sm] = reportStartTime.split(":").map(Number);
      const [eh, em] = reportEndTime.split(":").map(Number);
      const newDuration = eh * 60 + em - (sh * 60 + sm);
      if (newDuration <= 0) {
        return createResponse(400, false, "Invalid report times");
      }
      duration = newDuration;
    }

    // 🧾 Update DCR
    const updated = await prisma.dailyCallReport.update({
      where: { id: dcrId },
      data: {
        latitudeABM: latitude,
        longitudeABM: longitude,
        abmReportCompleted: true,
        ...(remarks && { remarks }),
        ...(products && { products }),
        ...(reportStartTime && { reportStartTime }),
        ...(reportEndTime && { reportEndTime }),
        duration,
      },
    });

    // ✅ Update DCR flag in related DailyPlanDoctor or DailyPlanChemist
    if (existing.dailyPlanDoctorId) {
      await prisma.dailyPlanDoctor.update({
        where: { id: existing.dailyPlanDoctorId },
        data: { dcr: true },
      });
    } else if (existing.dailyPlanChemistId) {
      await prisma.dailyPlanChemist.update({
        where: { id: existing.dailyPlanChemistId },
        data: { dcr: true },
      });
    }

    return createResponse(200, true, "DCR updated successfully by ABM", updated);
  } catch (err: any) {
    console.error("Error in updateDcrByAbm:", err);
    return createResponse(500, false, err.message);
  }
}

  },
};
