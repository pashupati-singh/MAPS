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
    createDcr: async (_: any, { data }: any , context : Context) => {
  try {
    const {
      dailyPlanId,
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

    if(!context){
      return createResponse(400, false, "Token missing or invalid");
    }
    if(!context.user){
      return createResponse(400, false, "User not found");
    }

    const {id , role} = context.user;
    const mrId = id;
    if(role !== "MR"){
      return createResponse(400, false, "not authorised");
    }
    const companyId = context.company?.id;
    if(!companyId){
       return createResponse(400, false, "Company Id is missing");
    }
    
    if(!latitude || !longitude) return createResponse(400, false, "Location is required");
    if(!doctorId || !chemistId) return createResponse(400, false, "Either doctorId or chemistId is required");

    const dailyPlan = await prisma.dailyPlan.findUnique({
      where: { id: dailyPlanId },
      include: { doctors: { include: { doctor: { include: { address: true } } } }, chemists: { include: { chemist: { include: { address: true } } } } },
    });
    if (!dailyPlan) return createResponse(404, false, "Daily plan not found");
    if (dailyPlan.workTogether && !dailyPlan.abmId)  return createResponse( 400, false, "ABM is required since workTogether is true" );
        
    if (doctorId && chemistId) {
      return createResponse(400, false, "Cannot assign both doctor and chemist");
    }
    if (abmId && dailyPlan.abmId !== abmId) {
      return createResponse(403, false, "ABM not assigned to this daily plan");
    }
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

    const [sh, sm] = reportStartTime.split(":").map(Number);
    const [eh, em] = reportEndTime.split(":").map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    if (duration <= 0) return createResponse(400, false, "Invalid report times");

    if (latitude && longitude && targetLat && targetLon) {
      const inRange = isLocationWithinRange(latitude, longitude, targetLat, targetLon, 50);
      if (!inRange) {
        return createResponse(400, false, "You are not at location");
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
        mrReportCompleted : true,
        latitudeMR: latitude,
        longitudeMR: longitude,
      },
    });

    return createResponse(201, true, "DCR created successfully", dcr);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},
    async updateDcrByAbm(_: any, { data }: any, context: Context) {
  try {
    if (!context?.user) {
      return createResponse(400, false, "User not authenticated");
    }

    const { id: userId, role } = context.user;
    if (role !== "ABM") {
      return createResponse(400, false, "Only ABM can update DCR");
    }
    if (!data.dcrId) {
      return createResponse(400, false, "DCR ID is required");
    }
    if (!data.latitude || !data.longitude) {
      return createResponse(400, false, "Location is required");
    }

    const existing = await prisma.dailyCallReport.findUnique({
      where: { id: data.dcrId },
      include: { dailyPlan: true },
    });

    if (!existing) {
      return createResponse(404, false, "DCR not found");
    }

    if (!existing.abmId || existing.abmId !== userId) {
      return createResponse(403, false, "You are not assigned to this DCR");
    }

    if (existing.latitudeMR && existing.longitudeMR) {
      const inRange = isLocationWithinRange(
        data.latitude,
        data.longitude,
        existing.latitudeMR,
        existing.longitudeMR,
        50
      );
      if (!inRange) {
        return createResponse(400, false, "You are not at MR's location");
      }
    }

    const updated = await prisma.dailyCallReport.update({
      where: { id: data.dcrId },
      data: {
        latitudeABM: data.latitude,
        longitudeABM: data.longitude,
        abmReportCompleted: true,
      },
    })
    return createResponse(200, true, "DCR updated successfully by ABM", updated);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
}
  },
};
