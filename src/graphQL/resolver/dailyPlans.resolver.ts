import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";
import { istTodayUtcRange, toUtcMidnight } from "../../utils/ConvertUTCToIST";

const prisma = new PrismaClient();

export const DailyPlanResolver = {
  Query: {
     getDailyPlansByCompanyId: async (_: any, args: { page?: number; limit?: number }, context: Context) => {
  try {
    if (!context || context.authError) {
      return createResponse(400, false, context?.authError || "Authorization Error");
    }

    const companyId = context.user?.companyId;
    if (!companyId) {
      return createResponse(400, false, "Company authorization required");
    }
 if(context?.user?.role) return createResponse(400, false, "You are not authorised");
    const page = args.page && args.page > 0 ? args.page : 1;
    const limit = args.limit && args.limit > 0 ? args.limit : 10;
    const skip = (page - 1) * limit;

    const totalPlans = await prisma.dailyPlan.count({ where: { companyId } });
    const lastPage = Math.ceil(totalPlans / limit);

    const plans = await prisma.dailyPlan.findMany({
      where: { companyId },
      skip,
      take: limit,
      orderBy: { planDate: "desc" },
      include: {
        doctors: {
          include: {
            DoctorCompany: {
              include: {
                doctor: true,
                doctorChemist: true,
                DoctorProduct: true,
              },
            },
          },
        },
        chemists: {
          include: {
            ChemistCompany: {
              include: {
                chemist: true,
                doctorChemist: true,
                ChemistProduct: true,
              },
            },
          },
        },
      },
    });

    return {
      code: 200,
      success: true,
      message: "Daily plans fetched successfully",
      data: plans,
      lastPage,
    };
  } catch (err: any) {
    console.error("Error in getDailyPlansByCompanyId:", err);
    return createResponse(500, false, err.message);
  }
     },

    getDailyPlansByMRId: async (_: any, args: { page?: number; limit?: number ; filter? : {startDate?: string, endDate?: string} }, context: Context) => {
      try {
        if (!context || context.authError) {
          return createResponse(400, false, context?.authError || "Authorization Error");
        }
        if(!context.user) return createResponse(400, false, "User authorization required");

        const { userId, role } = context.user;
        if (role !== "MR") {
          return createResponse(400, false, "Only MRs can create daily plans");
        }

        const companyId = context.company?.id;
        if (!companyId) {
          return createResponse(400, false, "Company ID is missing");
        }

        const whereClause: any = { companyId };
        if (role === "MR") {
          whereClause.mrId = userId;
        }

        if (args.filter && args.filter.startDate && args.filter.endDate) {
          const { startDate , endDate } = args.filter;          
          const start = toUtcMidnight(startDate);
          const end = toUtcMidnight(endDate);
          whereClause.planDate = { gte: start , lte: end };         
        }

        const page = args.page && args.page > 0 ? args.page : 1;
        const limit = args.limit && args.limit > 0 ? args.limit : 10;
        const skip = (page - 1) * limit;

        const totalPlans = await prisma.dailyPlan.count({ where: whereClause });
        const lastPage = Math.ceil(totalPlans / limit);

        const plans = await prisma.dailyPlan.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { planDate: "desc" },
          include: {
        doctors: {
          include: {
            DoctorCompany: {
              include: {
                doctor: true,
                doctorChemist: true,
                DoctorProduct: true,
              },
            },
          },
        },
        chemists: {
          include: {
            ChemistCompany: {
              include: {
                chemist: true,
                doctorChemist: true,
                ChemistProduct: true,
              },
            },
          },
        },
      },
        });

        return {
          code: 200,
          success: true,
          message: "Daily plans fetched successfully by MR ID",
          data: plans,
          lastPage,
        };
      } catch (err: any) {
        console.error("Error in getDailyPlansByMRId:", err);
        return createResponse(500, false, err.message);
      }
    },

    getDailyPlansByABMId: async (_: any, args: { page?: number; limit?: number }, context: Context) => {
      try {
        if (!context || context.authError) {
          return createResponse(400, false, context?.authError || "Authorization Error");
        }
        if(!context.user) return createResponse(400, false, "User authorization required");
        const { userId , role } = context.user;

        const companyId = context.company?.id;
        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        const whereClause: any = { companyId };
        if (role === "ABM") {
          whereClause.abmId = userId;
        }
       const { start, end } = istTodayUtcRange();
       if(start && end) whereClause.planDate = { gte: start, lte: end };
        const page = args.page && args.page > 0 ? args.page : 1;
        const limit = args.limit && args.limit > 0 ? args.limit : 10;
        const skip = (page - 1) * limit;

        const totalPlans = await prisma.dailyPlan.count({ where: whereClause });
        const lastPage = Math.ceil(totalPlans / limit);

        const plans = await prisma.dailyPlan.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { planDate: "desc" },
           include: {
        doctors: {
          include: {
            DoctorCompany: {
              include: {
                doctor: true,
                doctorChemist: true,
                DoctorProduct: true,
              },
            },
          },
        },
        chemists: {
          include: {
            ChemistCompany: {
              include: {
                chemist: true,
                doctorChemist: true,
                ChemistProduct: true,
              },
            },
          },
        },
      },
        });
        return {
          code: 200,
          success: true,
          message: "Daily plans fetched successfully by ABM ID",
          data: plans,
          lastPage,
        };
      } catch (err: any) {
        console.error("Error in getDailyPlansByABMId:", err);
        return createResponse(500, false, err.message);
      }
    },

    getDailyPlanById: async (_: any, { id }: { id: number } , context: Context) => {
      try {
        if(!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.user?.companyId) return createResponse(400, false, "Company authorization required");
        const companyId = context?.user?.companyId;
        if (!id) {
          return createResponse(400, false, "Daily Plan is required");
        }

        const plan = await prisma.dailyPlan.findUnique({
          where: { id , companyId },
           include: {
          doctors: {
          include: {
            DoctorCompany: {
              include: {
                doctor: true,
                doctorChemist: true,
                DoctorProduct: true,
              },
            },
          },
        },
        chemists: {
          include: {
            ChemistCompany: {
              include: {
                chemist: true,
                doctorChemist: true,
                ChemistProduct: true,
              },
            },
          },
        },
        mr: {
          include: {
            UserWorkingArea : {
              include: {
                WorkingArea : true
              }
            }
          }
        }
      },
        });

        if (!plan) {
          return createResponse(404, false, "Daily plan not found");
        }
        return createResponse(200, true, "Daily plan fetched successfully", plan);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getDailyPlansABMOfMr : async (_: any, __:any , context: Context) => {
      try {
        if (!context || context.authError) {
          return createResponse(400, false, context?.authError || "Authorization Error");
        }
        if(!context.user) return createResponse(400, false, "User authorization required");
        const { userId , role } = context.user;
        const companyId = context.company?.id;
        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }
        const { start, end } = istTodayUtcRange();
        const baseDateFilter = {
               companyId,
               planDate: { gte: start, lt: end },
               abmId: userId,
               createdBy : "MR"
             };
       
      const  dailyPlansOfMRs = await prisma.dailyPlan.findMany({
        where : baseDateFilter,
           include: {
           doctors: {
            include: {
             DoctorCompany: {
              include: {
                doctor: true,
                doctorChemist: true,
                DoctorProduct: true,
              },
            },
          },
        },
        chemists: {
          include: {
            ChemistCompany: {
              include: {
                chemist: true,
                doctorChemist: true,
                ChemistProduct: true,
              },
            },
          },
        },
        mr: {
          include: {
            UserWorkingArea : {
              include: {
                WorkingArea : true
              }
            }
          }
        }
      },
    })

     return {
      code: 200,
      success: true,
      message: "Remindars fetched successfully",
      data:  dailyPlansOfMRs ?? []
    };
    }catch (err: any) {
      return createResponse(500, false, err.message);
    }
    },

  },

  Mutation: {
    createDailyPlan: async (_: any, { data }: any, context: Context) => {
  try {
    if (!context || !context.user) {
      return createResponse(400, false, "Invalid token or user");
    }

    const { userId, role } = context.user;
    const companyId = context.company?.id || context.user?.companyId;
    if (!companyId) {
      return createResponse(400, false, "Company ID is missing");
    }
    const {
      doctorCompanyIds,
      chemistCompanyIds,
      workTogether,
      planDate,
      notes,
      workingAreaId,
    } = data;

    if (!planDate) {
      return createResponse(400, false, "Plan Date is required");
    }
    
    if (!workingAreaId) {
      return createResponse(400, false, "Working area is required");
    }

    let date: Date;
    try {
      date = toUtcMidnight(planDate);
    } catch (e: any) {
      return createResponse(400, false, e.message || "Invalid Plan Date");
    }

    let abmId: any;

    if (role === "MR") {
     abmId =  await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        abmId: true,
      },
    })
    }

    const baseFilter = {
  companyId,
  planDate: date,
};

let filters: any;

if (role === "MR") {
  filters = {
    ...baseFilter,
    mrId: userId,
    createdBy: "MR",
  };
} else if (role === "ABM") {
  filters = {
    ...baseFilter,
    abmId: userId,
    OR: [
      { createdBy: "ABM" },
      {
        createdBy: "MR",
        workTogether: true,
        isWorkTogetherConfirmed: true,
      },
    ],
  };
} else {
  return createResponse(400, false, "Only MR and ABM can create daily plans");
}

const existingPlan = await prisma.dailyPlan.findFirst({
  where: filters,
});


    if (existingPlan) {
      return createResponse(
        400,
        false,
        "You already created a daily plan for this date."
      );
    }

    const newPlan = await prisma.dailyPlan.create({
      data: {
        mrId: role === "MR" ? userId : 0,
        abmId : role === "MR" ? abmId?.abmId : userId,
        companyId,
        workTogether: workTogether || false,
        planDate: date,
        notes,
        createdBy : role === "MR" ? "MR" : "ABM",
        workingAreaId,
        doctors: {
          create:
            doctorCompanyIds?.map((doctorCompanyId: number) => ({
              doctorCompanyId,
            })) || [],
        },
        chemists: {
          create:
            chemistCompanyIds?.map((chemistCompanyId: number) => ({
              chemistCompanyId,
            })) || [],
        },
      },
    });

    return createResponse(201, true, "Daily plan created successfully", newPlan);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},


    updateDailyPlan: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context || !context.user) {
          return createResponse(400, false, "Invalid token or user");
        }

        const { userId, companyId, role } = context.user;
        const { dailyPlanId, notes, doctorCompanyIds, chemistCompanyIds , abmId , workTogether } = data;

        if (!dailyPlanId) {
          return createResponse(400, false, "Plan ID is required");
        }

        const plan = await prisma.dailyPlan.findUnique({
          where: { id: dailyPlanId },
        });

        if (!plan) {
          return createResponse(404, false, "Daily plan not found");
        }

        if (plan.companyId !== companyId) {
          return createResponse(403, false, "You are not authorized to update this daily plan");
        }
        const updatedData: any = {};
        if (notes !== undefined) updatedData.notes = notes;
        if (abmId !== undefined && workTogether) updatedData.abmId = abmId;
        if(workTogether && abmId !== undefined) updatedData.workTogether = workTogether

        await prisma.dailyPlan.update({
          where: { id: dailyPlanId },
          data: updatedData,
        });

        if (doctorCompanyIds) {
          await prisma.dailyPlanDoctor.deleteMany({ where: { dailyPlanId } });
          await prisma.dailyPlanDoctor.createMany({
            data: doctorCompanyIds.map((doctorCompanyId: number) => ({
              dailyPlanId,
              doctorCompanyId,
            })),
            skipDuplicates: true,
          });
        }

        if (chemistCompanyIds) {
          await prisma.dailyPlanChemist.deleteMany({ where: { dailyPlanId } });
          await prisma.dailyPlanChemist.createMany({
            data: chemistCompanyIds.map((chemistCompanyId: number) => ({
              dailyPlanId,
              chemistCompanyId,
            })),
            skipDuplicates: true,
          });
        }
        return createResponse(200, true, "Daily plan updated successfully");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

  updateDailyPlanByAbm: async (_: any, { data }: any, context: Context) => {
  try {
    if (!context || !context.user) {
      return createResponse(400, false, "Invalid token or user");
    }

    const { companyId, role, userId } = context.user;
    if (role !== "ABM") {
      return createResponse(400, false, "Only ABMs can perform this action");
    }

    const { dailyPlanId, isApproved, isRejected, isWorkTogetherConfirmed } = data;

    if (!dailyPlanId) {
      return createResponse(400, false, "Plan ID is required");
    }

    // 🔹 Load the plan + its doctors/chemists (needed to clone)
    const plan = await prisma.dailyPlan.findUnique({
      where: { id: dailyPlanId },
      include: {
        doctors: {
          select: { doctorCompanyId: true },
        },
        chemists: {
          select: { chemistCompanyId: true },
        },
      },
    });

    if (!plan) {
      return createResponse(404, false, "Daily plan not found");
    }

    if (plan.companyId !== companyId) {
      return createResponse(403, false, "Unauthorized to update this daily plan");
    }

    if (isApproved && isRejected) {
      return createResponse(400, false, "Plan cannot be both approved and rejected");
    }

    const updatedData: any = {};

    if (typeof isApproved === "boolean") {
      updatedData.isApproved = isApproved;
      if (isApproved) updatedData.isRejected = false;
    }

    if (typeof isRejected === "boolean") {
      updatedData.isRejected = isRejected;
      if (isRejected) updatedData.isApproved = false;
    }
    if (typeof isWorkTogetherConfirmed === "boolean") {
      if (!plan.workTogether) {
        return createResponse(400, false, "WorkTogether not requested by MR");
      }

      updatedData.isWorkTogetherConfirmed = isWorkTogetherConfirmed;

      if (isWorkTogetherConfirmed === true) {
        const abmOwnPlan = await prisma.dailyPlan.findFirst({
          where: {
            companyId,
            planDate: plan.planDate,
            createdBy: "ABM",
            abmId: userId,
          },
          select: { id: true },
        });

        if (abmOwnPlan) {
          return createResponse(
            400,
            false,
            "You already have your own daily plan for this date."
          );
        }
         await prisma.dailyPlan.create({
          data: {
            abmId: userId,
            companyId,
            workTogether: plan.workTogether,
            isApproved: true,
            isRejected: false,
            isWorkTogetherConfirmed: true,
            planDate: plan.planDate,
            notes: plan.notes ?? undefined,
            workingAreaId: plan.workingAreaId ?? undefined,
            createdBy: "ABM",
            doctors: {
              create: plan.doctors.map((d) => ({
                doctorCompanyId: d.doctorCompanyId!,
              })),
            },
            chemists: {
              create: plan.chemists.map((c) => ({
                chemistCompanyId: c.chemistCompanyId!,
              })),
            },
          },
        });
      }
    }

    if (Object.keys(updatedData).length === 0) {
      return createResponse(400, false, "No valid changes to update");
    }

    const updatedPlan = await prisma.dailyPlan.update({
      where: { id: dailyPlanId },
      data: updatedData,
    });

    return createResponse(200, true, "Daily plan updated by ABM successfully", updatedPlan);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},


    deleteDailyPlan: async (_: any, { dailyPlanId }: { dailyPlanId: number }, context: Context) => {
      try {
        if (!context || !context.user) {
          return createResponse(400, false, "Invalid token or user");
        }

        if (!dailyPlanId) {
          return createResponse(400, false, "Plan ID is required");
        }

        const plan = await prisma.dailyPlan.findUnique({ where: { id: dailyPlanId } });
        if (!plan) {
          return createResponse(404, false, "Daily plan not found");
        }

        await prisma.dailyPlanDoctor.deleteMany({ where: { dailyPlanId } });
        await prisma.dailyPlanChemist.deleteMany({ where: { dailyPlanId } });
        await prisma.dailyPlan.delete({ where: { id: dailyPlanId } });

        return createResponse(200, true, "Daily plan deleted successfully");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
