import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";

const prisma = new PrismaClient();

export const WorkingAreaResolver = {
  Query: {
    getWorkingAreasByCompanyId: async (
      _: any,
      args: { companyId?: number , page?: number; limit?: number },
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return createResponse(
            400,
            false,
            context?.authError || "Authorization Error"
          );
        }
        const page = args.page && args.page > 0 ? args.page : 1;
        const limit = args.limit && args.limit > 0 ? args.limit : 10;

        const contextCompanyId = context.company?.id || context?.user?.companyId || null;
        const { companyId: argCompanyId } = args;

        let companyId = argCompanyId || contextCompanyId;

        if (!companyId) {
          return createResponse(400, false, "Company ID is required");
        }

        if (
          argCompanyId &&
          contextCompanyId &&
          argCompanyId !== contextCompanyId 
        ) {
          return createResponse(403, false, "You are not authorised");
        }

        const totalWorkingAreas = await prisma.workingArea.count({
          where: { companyId },
        });
        const lastPage = Math.ceil(totalWorkingAreas / limit);

        const workingAreas = await prisma.workingArea.findMany({
          where: { companyId },
          orderBy: { id: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        });

        return {
         code : 200,
         success : true,
         message : "Working areas fetched successfully",
         data : workingAreas,
          lastPage
        };
      } catch (err: any) {
        console.error("Error in getWorkingAreasByCompanyId:", err);
        return createResponse(500, false, err.message);
      }
    },

    getWorkingAreaRelations: async (
      _: any,
      { workingAreaId }: { workingAreaId: number },
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return createResponse(
            400,
            false,
            context?.authError || "Authorization Error"
          );
        }

        const companyId = context.company?.id || context.user?.companyId;
        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        if (!workingAreaId) {
          return createResponse(400, false, "Working area ID is required");
        }
        const area = await prisma.workingArea.findFirst({
          where: { id: workingAreaId, companyId },
          include: {
            DoctorCompanyWorkingArea: {
              include: {
                DoctorCompany: {
                  include: {
                    doctor: true,
                  },
                },
              },
            },
            ChemistCompanyWorkingArea: {
              include: {
                ChemistCompany: {
                  include: {
                    chemist: true,
                  },
                },
              },
            },
            UserWorkingArea: {
              include: {
                User: true,
              },
            },
          },
        });

        if (!area) {
          return createResponse(404, false, "Working area not found");
        }

        const doctorCompanies =
      area.DoctorCompanyWorkingArea?.map((dcwa) => dcwa.DoctorCompany) ?? [];

    const chemistCompanies =
      area.ChemistCompanyWorkingArea?.map(
        (ccwa) => ccwa.ChemistCompany
      ) ?? [];

    const users =
      area.UserWorkingArea?.map((uwa) => uwa.User) ?? [];

    const data = {
      workingArea: area,
      doctorCompanies,
      chemistCompanies,
      users,
    };

        return createResponse(
          200,
          true,
          "Working area relations fetched successfully",
          data
        );
      } catch (err: any) {
        console.error("Error in getWorkingAreaRelations:", err);
        return createResponse(500, false, err.message);
      }
    },

    getUsersByWorkingArea: async (
      _: any,
      { workingAreaId }: { workingAreaId: number },
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return createResponse(
            400,
            false,
            context?.authError || "Authorization Error"
          );
        }

        const companyId = context.company?.id || context.user?.companyId;
        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        if (!workingAreaId) {
          return createResponse(400, false, "Working area ID is required");
        }

        const area = await prisma.workingArea.findFirst({
          where: { id: workingAreaId, companyId },
          include: {
            UserWorkingArea: {
              include: { User: true },
            },
          },
        });

        if (!area) {
          return createResponse(404, false, "Working area not found");
        }

        const users =
          area.UserWorkingArea?.map((uwa) => uwa.User) ?? [];

        return createResponse(
          200,
          true,
          "Users fetched successfully for working area",
          users
        );
      } catch (err: any) {
        console.error("Error in getUsersByWorkingArea:", err);
        return createResponse(500, false, err.message);
      }
    },
getUsersByWorkingAreabyUserId: async (
  _: any,
  __: any,
  context: Context
) => {
  try {
    if (!context || context.authError) {
      return createResponse(
        400,
        false,
        context?.authError || "Authorization Error"
      );
    }

    // use company either from context.company or user
    const companyId = context.company?.id ?? context.user?.companyId;
    const userId = context.user?.userId;

    if (!companyId) {
      return createResponse(400, false, "Company authorization required");
    }
    if (!userId) {
      return createResponse(400, false, "User authorization required");
    }

    // get ALL working areas for this user
    const links = await prisma.userWorkingArea.findMany({
      where: {
        userId,
        WorkingArea: {
          companyId, // make sure the area belongs to this company
        },
      },
      include: {
        WorkingArea: true,
      },
    });

    // extract just the WorkingArea objects
    const areas =
      links
        .map(link => link.WorkingArea)
        .filter((wa): wa is NonNullable<typeof wa> => wa != null) || [];

    if (areas.length === 0) {
      return createResponse(404, false, "Working area not found", []);
    }

    // 👇 IMPORTANT: pass array of WorkingArea to match GraphQL: data: [WorkingArea!]
    return createResponse(
      200,
      true,
      "Users fetched successfully for working area",
      areas
    );
  } catch (err: any) {
    console.error("Error in getUsersByWorkingAreabyUserId:", err);
    return createResponse(500, false, err.message);
  }
},

   getWorkingAreaData: async (_: any, { workingAreaId }: { workingAreaId: number }, context: Context) => {
  try {
    if (!context || context.authError) {
      return createResponse(
        400,
        false,
        context?.authError || "Authorization Error"
      );
    }

    const companyId = context.user?.companyId;
    if (!companyId) {
      return createResponse(400, false, "Company ID is required");
    }

    const userWorkingArea = await prisma.userWorkingArea.findMany({
      where: { workingAreaId }
    });

    const chemistCompanyWorkingArea = await prisma.chemistCompanyWorkingArea.findMany({
      where: { workingAreaId }
    });

    const doctorCompanyWorkingArea = await prisma.doctorCompanyWorkingArea.findMany({
      where: { workingAreaId }
    });

    const users = await prisma.user.findMany({
      where: { companyId },
    });

    const doctors = await prisma.doctorCompany.findMany({
      where: { companyId },
      include: { doctor: true }
    });

    const chemists = await prisma.chemistCompany.findMany({
      where: { companyId },
      include: { chemist: true }
    });

    const usersWithFlag = users.map(u => ({
  ...u,
  isInWorkingArea: userWorkingArea.some(uw => uw.userId === u.id),
}));

    const doctorsWithFlag = doctors.map(d => ({
  ...d,
  isInWorkingArea: doctorCompanyWorkingArea.some(dcwa => dcwa.doctorCompanyId === d.id),
}));

    const chemistsWithFlag = chemists.map(c => ({
  ...c,
  isInWorkingArea: chemistCompanyWorkingArea.some(ccwa => ccwa.chemistCompanyId === c.id),
}));

    return {
      code: 200,
      success: true,
      message: "Working area data fetched successfully",
      data: {
        user: usersWithFlag,
        doctorCompany: doctorsWithFlag,
        chemistCompany: chemistsWithFlag
      }
    };

  } catch (error: any) {
    console.error("Error in getUsersByWorkingArea:", error);
    return createResponse(500, false, error.message);
  }
},

  },

  Mutation: {
    createWorkingArea: async (
      _: any,
      { data }: any,
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return createResponse(
            400,
            false,
            context?.authError || "Authorization Error"
          );
        }

        const companyId = context.company?.id || context.user?.companyId;
        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        const { state, city, district, workingArea } = data;

        if (!state || !city || !district || !workingArea) {
          return createResponse(
            400,
            false,
            "state, city, district and workingArea are required"
          );
        }

        const newWorkingArea = await prisma.workingArea.create({
          data: {
            companyId,
            state,
            city,
            district,
            workingArea,
          },
        });

        return createResponse(
          201,
          true,
          "Working area created successfully",
          newWorkingArea
        );
      } catch (err: any) {
        console.error("Error in createWorkingArea:", err);
        return createResponse(500, false, err.message);
      }
    },

    updateWorkingArea: async (
      _: any,
      { data }: any,
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return createResponse(
            400,
            false,
            context?.authError || "Authorization Error"
          );
        }

        const companyId = context.company?.id || context.user?.companyId;
        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        const { id, state, city, district, workingArea } = data;

        if (!id) {
          return createResponse(400, false, "WorkingArea ID is required");
        }

        const existing = await prisma.workingArea.findUnique({
          where: { id },
        });

        if (!existing) {
          return createResponse(404, false, "Working area not found");
        }

        if (existing.companyId !== companyId) {
          return createResponse(
            403,
            false,
            "You are not authorized to update this working area"
          );
        }

        const updateData: any = {};
        if (state !== undefined) updateData.state = state;
        if (city !== undefined) updateData.city = city;
        if (district !== undefined) updateData.district = district;
        if (workingArea !== undefined) updateData.workingArea = workingArea;

        const updated = await prisma.workingArea.update({
          where: { id },
          data: updateData,
        });

        return createResponse(
          200,
          true,
          "Working area updated successfully",
          updated
        );
      } catch (err: any) {
        console.error("Error in updateWorkingArea:", err);
        return createResponse(500, false, err.message);
      }
    },

    deleteWorkingArea: async (
      _: any,
      { id }: { id: number },
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return createResponse(
            400,
            false,
            context?.authError || "Authorization Error"
          );
        }

        const companyId = context.company?.id || context.user?.companyId;
        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        if (!id) {
          return createResponse(400, false, "WorkingArea ID is required");
        }

        const existing = await prisma.workingArea.findUnique({
          where: { id },
        });

        if (!existing) {
          return createResponse(404, false, "Working area not found");
        }

        if (existing.companyId !== companyId) {
          return createResponse(
            403,
            false,
            "You are not authorized to delete this working area"
          );
        }

        await prisma.workingArea.delete({
          where: { id },
        });

        return createResponse(
          200,
          true,
          "Working area deleted successfully"
        );
      } catch (err: any) {
        console.error("Error in deleteWorkingArea:", err);
        return createResponse(500, false, err.message);
      }
    },

    // assignEntitiesToWorkingArea: async (
    //   _: any,
    //   { data }: any,
    //   context: Context
    // ) => {
    //   try {
    //     if (!context || context.authError) {
    //       return createResponse(
    //         400,
    //         false,
    //         context?.authError || "Authorization Error"
    //       );
    //     }

    //     const companyId = context.company?.id || context.user?.companyId;
    //     if (!companyId) {
    //       return createResponse(400, false, "Company authorization required");
    //     }

    //     const {
    //       workingAreaId,
    //       doctorCompanyIds,
    //       chemistCompanyIds,
    //       userIds,
    //     } = data;

    //     if (!workingAreaId) {
    //       return createResponse(400, false, "Working area ID is required");
    //     }

    //     const workingArea = await prisma.workingArea.findFirst({
    //       where: { id: workingAreaId, companyId },
    //     });

    //     if (!workingArea) {
    //       return createResponse(404, false, "Working area not found");
    //     }

    //     if (Array.isArray(doctorCompanyIds) && doctorCompanyIds.length > 0) {
    //       await prisma.doctorCompanyWorkingArea.createMany({
    //         data: doctorCompanyIds.map((id: number) => ({
    //           doctorCompanyId: id,
    //           workingAreaId,
    //         })),
    //         skipDuplicates: true,
    //       });
    //     }

    //     if (Array.isArray(chemistCompanyIds) && chemistCompanyIds.length > 0) {
    //       await prisma.chemistCompanyWorkingArea.createMany({
    //         data: chemistCompanyIds.map((id: number) => ({
    //           chemistCompanyId: id,
    //           workingAreaId,
    //         })),
    //         skipDuplicates: true,
    //       });
    //     }

    //     if (Array.isArray(userIds) && userIds.length > 0) {
    //       await prisma.userWorkingArea.createMany({
    //         data: userIds.map((id: number) => ({
    //           userId: id,
    //           workingAreaId,
    //         })),
    //         skipDuplicates: true,
    //       });
    //     }

    //     return createResponse(
    //       200,
    //       true,
    //       "Entities assigned to working area successfully"
    //     );
    //   } catch (err: any) {
    //     console.error("Error in assignEntitiesToWorkingArea:", err);
    //     return createResponse(500, false, err.message);
    //   }
    // },
     
    assignEntitiesToWorkingArea: async (
  _: any,
  { data }: any,
  context: Context
) => {
  try {
    if (!context || context.authError) {
      return createResponse(
        400,
        false,
        context?.authError || "Authorization Error"
      );
    }

    const companyId = context.company?.id || context.user?.companyId;
    if (!companyId) {
      return createResponse(400, false, "Company authorization required");
    }

    const {
      workingAreaId,
      doctorCompanyIds,
      chemistCompanyIds,
      userIds,
    } = data;

    if (!workingAreaId) {
      return createResponse(400, false, "Working area ID is required");
    }

    const workingArea = await prisma.workingArea.findFirst({
      where: { id: workingAreaId, companyId },
    });

    if (!workingArea) {
      return createResponse(404, false, "Working area not found");
    }

    // ============================
    // 🔹 SYNC USERS
    // ============================
    if (Array.isArray(userIds)) {
      // 1) get existing mappings for this working area
      const existingUserMappings = await prisma.userWorkingArea.findMany({
        where: { workingAreaId },
      });

      const existingUserIds = existingUserMappings
        .map((row) => row.userId)
        .filter((id): id is number => id != null);

      // 2) rows to delete: in DB but not in incoming array
      const rowsToDelete = existingUserMappings.filter(
        (row) => !userIds.includes(row.userId ?? -1)
      );

      const deleteIds = rowsToDelete.map((row) => row.id);

      if (deleteIds.length > 0) {
        await prisma.userWorkingArea.deleteMany({
          where: {
            id: { in: deleteIds },
          },
        });
      }

      // 3) rows to insert: in incoming array but not in DB
      const userIdsToInsert = userIds.filter(
        (id: number) => !existingUserIds.includes(id)
      );

      if (userIdsToInsert.length > 0) {
        await prisma.userWorkingArea.createMany({
          data: userIdsToInsert.map((id: number) => ({
            userId: id,
            workingAreaId,
          })),
        });
      }
    }

    // ============================
    // 🔹 SYNC DOCTOR COMPANIES
    // ============================
    if (Array.isArray(doctorCompanyIds)) {
      const existingDoctorMappings =
        await prisma.doctorCompanyWorkingArea.findMany({
          where: { workingAreaId },
        });

      const existingDoctorIds = existingDoctorMappings
        .map((row) => row.doctorCompanyId)
        .filter((id): id is number => id != null);

      // delete: existing but not in incoming
      const doctorRowsToDelete = existingDoctorMappings.filter(
        (row) => !doctorCompanyIds.includes(row.doctorCompanyId ?? -1)
      );

      const deleteDoctorIds = doctorRowsToDelete.map((row) => row.id);

      if (deleteDoctorIds.length > 0) {
        await prisma.doctorCompanyWorkingArea.deleteMany({
          where: {
            id: { in: deleteDoctorIds },
          },
        });
      }

      // insert: in incoming but not in existing
      const doctorIdsToInsert = doctorCompanyIds.filter(
        (id: number) => !existingDoctorIds.includes(id)
      );

      if (doctorIdsToInsert.length > 0) {
        await prisma.doctorCompanyWorkingArea.createMany({
          data: doctorIdsToInsert.map((id: number) => ({
            doctorCompanyId: id,
            workingAreaId,
          })),
        });
      }
    }

    // ============================
    // 🔹 SYNC CHEMIST COMPANIES
    // ============================
    if (Array.isArray(chemistCompanyIds)) {
      const existingChemistMappings =
        await prisma.chemistCompanyWorkingArea.findMany({
          where: { workingAreaId },
        });

      const existingChemistIds = existingChemistMappings
        .map((row) => row.chemistCompanyId)
        .filter((id): id is number => id != null);

      // delete: existing but not in incoming
      const chemistRowsToDelete = existingChemistMappings.filter(
        (row) => !chemistCompanyIds.includes(row.chemistCompanyId ?? -1)
      );

      const deleteChemistIds = chemistRowsToDelete.map((row) => row.id);

      if (deleteChemistIds.length > 0) {
        await prisma.chemistCompanyWorkingArea.deleteMany({
          where: {
            id: { in: deleteChemistIds },
          },
        });
      }

      // insert: in incoming but not in existing
      const chemistIdsToInsert = chemistCompanyIds.filter(
        (id: number) => !existingChemistIds.includes(id)
      );

      if (chemistIdsToInsert.length > 0) {
        await prisma.chemistCompanyWorkingArea.createMany({
          data: chemistIdsToInsert.map((id: number) => ({
            chemistCompanyId: id,
            workingAreaId,
          })),
        });
      }
    }

    return createResponse(
      200,
      true,
      "Entities assigned to working area successfully"
    );
  } catch (err: any) {
    console.error("Error in assignEntitiesToWorkingArea:", err);
    return createResponse(500, false, err.message);
  }
},




    assignWorkingAreasToEntities: async (
      _: any,
      { data }: any,
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return createResponse(
            400,
            false,
            context?.authError || "Authorization Error"
          );
        }

        const companyId = context.company?.id || context.user?.companyId;
        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        const { workingAreaIds, userId, doctorCompanyId, chemistCompanyId } =
          data;

        if (
          !Array.isArray(workingAreaIds) ||
          workingAreaIds.length === 0
        ) {
          return createResponse(
            400,
            false,
            "At least one workingAreaId is required"
          );
        }

        if (!userId && !doctorCompanyId && !chemistCompanyId) {
          return createResponse(
            400,
            false,
            "At least one of userId, doctorCompanyId, chemistCompanyId is required"
          );
        }

        // Ensure working areas belong to this company
        const validAreas = await prisma.workingArea.findMany({
          where: {
            id: { in: workingAreaIds },
            companyId,
          },
          select: { id: true },
        });

        const validAreaIds = validAreas.map((a) => a.id);
        if (validAreaIds.length === 0) {
          return createResponse(
            400,
            false,
            "No valid working areas found for this company"
          );
        }

        // USER ↔ WorkingArea
        if (userId) {
          await prisma.userWorkingArea.deleteMany({
            where: { userId },
          });

          await prisma.userWorkingArea.createMany({
            data: validAreaIds.map((waId) => ({
              userId,
              workingAreaId: waId,
            })),
            skipDuplicates: true,
          });
        }

        // DoctorCompany ↔ WorkingArea
        if (doctorCompanyId) {
          await prisma.doctorCompanyWorkingArea.deleteMany({
            where: { doctorCompanyId },
          });

          await prisma.doctorCompanyWorkingArea.createMany({
            data: validAreaIds.map((waId) => ({
              doctorCompanyId,
              workingAreaId: waId,
            })),
            skipDuplicates: true,
          });
        }

        // ChemistCompany ↔ WorkingArea
        if (chemistCompanyId) {
          await prisma.chemistCompanyWorkingArea.deleteMany({
            where: { chemistCompanyId },
          });

          await prisma.chemistCompanyWorkingArea.createMany({
            data: validAreaIds.map((waId) => ({
              chemistCompanyId,
              workingAreaId: waId,
            })),
            skipDuplicates: true,
          });
        }

        return createResponse(
          200,
          true,
          "Working areas assigned to entities successfully"
        );
      } catch (err: any) {
        console.error("Error in assignWorkingAreasToEntities:", err);
        return createResponse(500, false, err.message);
      }
    },
  },
  
};
