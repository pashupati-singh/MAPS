import { Context } from "../../context";
import { getLatLongFromAddress } from "../../utils/latlong";
import { createResponse } from "../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ChemistResolvers = {
   Query: {
 chemists: async (
  _: any,
  args: { page?: number; limit?: number; search?: string; workingAreaId?: number },
  context: Context
) => {
  try {
    if (!context || context.authError) {
      return { code: 401, success: false, message: "Unauthorized", chemists: [], lastPage: 0 };
    }

    const companyId = context.user?.companyId;
    if (!companyId) {
      return { code: 401, success: false, message: "Company not found", chemists: [], lastPage: 0 };
    }

    const page = args.page && args.page > 0 ? args.page : 1;
    const limit = args.limit && args.limit > 0 ? args.limit : 10;

    const { search, workingAreaId } = args;

    // 🔍 build dynamic where clause
    const where: any = { companyId };

    // 1) search by chemist.name OR ChemistCompany.email OR ChemistCompany.phone
    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { chemist: { name: { contains: term, mode: "insensitive" } } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
      ];
    }

    // 2) filter by workingAreaId via ChemistCompanyWorkingArea relation
    if (typeof workingAreaId === "number") {
      where.ChemistCompanyWorkingArea = {
        some: {
          workingAreaId,
        },
      };
    }

    const totalChemists = await prisma.chemistCompany.count({ where });
    const lastPage = Math.ceil(totalChemists / limit) || 1;

    const chemists = await prisma.chemistCompany.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
      include: {
        chemist: { include: { address: true } },
        doctorChemist: {
          include: {
            doctorCompany: {
              include: {
                doctor: { include: { address: true } },
              },
            },
          },
        },
        // optional: include working areas if you want them on client
        ChemistCompanyWorkingArea: true,
      },
    });

    return {
      code: 200,
      success: true,
      message: "Chemists fetched successfully",
      chemists,
      lastPage,
    };
  } catch (err: any) {
    return {
      code: 500,
      success: false,
      message: err.message,
      chemists: [],
      lastPage: 0,
    };
  }
},


  chemist: async (_: any, { id }: any, context: Context) => {
    try {
      if (!context || context.authError) {
        return { code: 401, success: false, message: "Unauthorized", data: null };
      }
      const companyId = context.user?.companyId;
      if (!companyId) {
        return { code: 401, success: false, message: "Company not found", data: null };
      }

     const chemistCompany = await prisma.chemistCompany.findFirst({
  where: { id: Number(id), companyId },
  include: {
    chemist: { include: { address: true } },
    doctorChemist: {
      include: {
        doctorCompany: {
          include: {
            doctor: { include: { address: true } },
          },
        },
      },
    },
    ChemistProduct: { 
      include: {
        product: {
          select: {
            id: true,
            name: true,
            type: true,
            salt: true,
            details: true,
          },
        },
      },
    },
  },
});


      if (!chemistCompany) {
        return {
          code: 404,
          success: false,
          message: "Chemist not found for this company",
          data: null,
        };
      }

      return {
        code: 200,
        success: true,
        message: "Chemist fetched successfully",
        data: chemistCompany,
      };
    } catch (err: any) {
      return {
        code: 500,
        success: false,
        message: err.message,
        data: null,
      };
    }
  },
},

  Mutation: {
createChemist: async (_: any, { input }: any, context: Context) => {
  try {
    if (!context || context.authError) {
      return { code: 400, success: false, message: context.authError || "Authorization Error", data: null };
    }

    const companyId = context.user?.companyId;
    if (!companyId) {
      return { code: 400, success: false, message: "Company authorization required", data: null };
    }

    let addressRecord = null;
    if (input.address) {
      const fullAddress = [
        input.address.address,
        input.address.city,
        input.address.state,
        input.address.pinCode,
        input.address.country,
        input.address.landmark,
      ].filter(Boolean).join(", ");

      let latitude: number | null =
        input.address.latitude != null ? Number(input.address.latitude) : null;
      let longitude: number | null =
        input.address.longitude != null ? Number(input.address.longitude) : null;


      // try {
      //   const coords = await getLatLongFromAddress(fullAddress);
      //   latitude = coords.latitude;
      //   longitude = coords.longitude;
      // } catch (error: any) {
      //   return { code: 400, success: false, message: `Failed to fetch coordinates: ${error.message}`, data: null };
      // }

      addressRecord = await prisma.address.create({
        data: {
          ...input.address,
          latitude,
          longitude,
        },
      });
    }

    const chemist = await prisma.chemist.create({
      data: {
        name: input.name,
        titles: input.titles ?? [],
        status: input.status || "ACTIVE",
        addressId: addressRecord ? addressRecord.id : null,
        companies: {
          create: {
            companyId,
            email: input.email ?? null,
            phone: input.phone ?? null,
            dob: input.dob ?? null,
            anniversary: input.anniversary ?? null,
            approxTarget: input.approxTarget ?? null,
          },
        },
      },
      include: {
        address: true,
        companies: { include: { company: true } },
      },
    });

    return { code: 201, success: true, message: "Chemist created successfully", data: chemist };
  } catch (err: any) {
    return { code: 500, success: false, message: err.message, data: null };
  }
},
     updateChemist: async (_: any, { input }: any, context:Context) => {
      try {
        if (!context || context.authError) {
      return { code: 400, success: false, message: context.authError || "Authorization Error", data: null };
    }

     const companyId = context.user?.companyId;
     if (!companyId) {
       return { code: 400, success: false, message: "Company authorization required", data: null };
     }

        const chemist = await prisma.chemist.findUnique({
          where: { id: Number(input.chemistId) },
        });
        if (!chemist) return createResponse(404, false, "Chemist not found");

        let addressId = chemist.addressId;

        if (input.address) {
          const fullAddress = [
            input.address.address,
            input.address.city,
            input.address.state,
            input.address.pinCode,
            input.address.country,
            input.address.landmark,
          ]
            .filter(Boolean)
            .join(", ");

         let latitude: number | null = input.address.latitude ?? null;
      let longitude: number | null = input.address.longitude ?? null;

          // try {
          //   const coords = await getLatLongFromAddress(fullAddress);
          //   latitude = coords.latitude;
          //   longitude = coords.longitude;
          // } catch (error: any) {
          //   return createResponse(
          //     400,
          //     false,
          //     `Failed to fetch coordinates: ${error.message}`
          //   );
          // }

          if (addressId) {
            await prisma.address.update({
              where: { id: addressId },
              data: { ...input.address, latitude, longitude },
            });
          } else {
            const newAddress = await prisma.address.create({
              data: { ...input.address, latitude, longitude },
            });
            addressId = newAddress.id;
          }
        }

        const updatedChemist = await prisma.chemist.update({
          where: { id: Number(input.chemistId) },
          data: {
            name: input.name ?? chemist.name,
            titles: input.titles ?? chemist.titles,
            status: input.status ?? chemist.status,
            addressId,
          },
          include: { address: true },
        });

    if (companyId) {
      await prisma.chemistCompany.updateMany({
        where: { chemistId: Number(input.chemistId), companyId },
        data: {
          email: input.email ?? undefined,
          phone: input.phone ?? undefined,
          dob: input.dob ?? undefined,
          anniversary: input.anniversary ?? undefined,
          approxTarget: input.approxTarget ?? undefined,
        },
      });
    }
    const chemists = await prisma.chemist.findUnique({
      where: { id: Number(input.chemistId) },
      include: {
        address: true,
        companies: true,
      },
    });


        return { code: 200, success: true, message: "Chemist updated successfully", data: chemists};
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

assignChemistToCompany: async (_: any, { input }: any, context: Context) => {
  try {
    if (!context || context.authError) {
      return { 
        code: 400, 
        success: false, 
        message: context.authError || "Authorization Error", 
        chemistCompany: null 
      };
    }

    const companyId = context.user?.companyId;
    if (!companyId) {
      return createResponse(401, false, "Company not found");
    }

    const { chemistId, email, phone, dob, anniversary, approxTarget } = input;

    // check if already linked
    const existingLink = await prisma.chemistCompany.findFirst({
      where: { chemistId, companyId },
    });

    if (existingLink) {
      return createResponse(400, false, "Chemist is already assigned to this company");
    }

    // create with relations included
    const chemistCompany = await prisma.chemistCompany.create({
      data: {
        chemistId,
        companyId,
        email,
        phone,
        dob: dob || null,
        anniversary: anniversary || null,
        approxTarget,
      },
      include: {
        chemist: { include: { address: true } },   // global chemist details
        doctorChemist: {                           // linked doctors in this company
          include: {
            doctorCompany: {
              include: {
                doctor: { include: { address: true } },
              },
            },
          },
        },
      },
    });

    return {
      code: 201,
      success: true,
      message: "Chemist assigned to company successfully",
      chemistCompany,
    };
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},


   unassignChemistFromCompany: async (_: any, { input }: any, context: Context) => {
  try {
    if (!context || context.authError) {
      return { code: 400, success: false, message: context.authError || "Authorization Error", data: null };
    }

    if (!context.user?.companyId) {
      return createResponse(401, false, "Company not found");
    }

    const companyId = context.user?.companyId;
    const { chemistIds } = input;

    const existingLinks = await prisma.chemistCompany.findMany({
      where: { chemistId: { in: chemistIds }, companyId },
    });

    if (!existingLinks || existingLinks.length === 0) {
      return createResponse(404, false, "No matching chemists assigned to this company");
    }

    await prisma.chemistCompany.deleteMany({
      where: { id: { in: existingLinks.map((link) => link.id) } },
    });

    return createResponse(200, true, "Chemists unassigned from company successfully");
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},

assignDoctorToChemist: async (_: any, { input }: any, context: Context) => {
  try {
    if (!context.user || context.authError) {
      return createResponse(401, false, "Unauthorized");
    }

    const { doctorCompanyId, chemistCompanyIds } = input;
    const companyId = context.user?.companyId;
    if (!companyId) {
      return createResponse(401, false, "Company not found");
    }

    const doctorCompany = await prisma.doctorCompany.findFirst({
      where: { id: doctorCompanyId, companyId },
    });
    if (!doctorCompany) {
      return createResponse(404, false, "Doctor not found for this company");
    }

    const validChemistCompanies = await prisma.chemistCompany.findMany({
      where: { id: { in: chemistCompanyIds }, companyId },
      select: { id: true },
    });
    const validChemistIds = validChemistCompanies.map(c => c.id);

    if (validChemistIds.length === 0) {
      return createResponse(400, false, "No valid chemists found for this company");
    }

    const existingLinks = await prisma.doctorChemist.findMany({
      where: {
        doctorCompanyId,
        chemistCompanyId: { in: validChemistIds },
        companyId,
      },
    });

    const alreadyAssignedIds = existingLinks.map(l => l.chemistCompanyId);
    const newChemistIds = validChemistIds.filter(
      id => !alreadyAssignedIds.includes(id)
    );

  const createdLinks = await prisma.$transaction(
  newChemistIds.map(id =>
    prisma.doctorChemist.create({
      data: {
        doctorCompanyId,
        chemistCompanyId: id,
        companyId,
      },
      include: {
        doctorCompany: {
          include: {
            doctor: { include: { address: true } },
          },
        },
        chemistCompany: {
          include: {
            chemist: { include: { address: true } },
          },
        },
      },
    })
  )
);


    return {
      code: 201,
      success: true,
      message: "Doctor assigned new chemist(s).",
      created: createdLinks,
    };
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},


unassignDoctorFromChemist: async (_: any, { input }: any, context: Context) => {
  try {
    if (!context.user || context.authError) {
      return createResponse(401, false, "Unauthorized");
    }

    const { doctorChemistIds } = input;
    const companyId = context?.user?.companyId;

    const existingLinks = await prisma.doctorChemist.findMany({
      where: {
        id: { in: doctorChemistIds },
        companyId,
      },
    });

    if (!existingLinks || existingLinks.length === 0) {
      return createResponse(
        404,
        false,
        "No matching doctor-chemist links found for this company"
      );
    }

    await prisma.doctorChemist.deleteMany({
      where: { id: { in: existingLinks.map((link) => link.id) } },
    });

    return createResponse(
      200,
      true,
      `Doctor unassigned from chemist(s) successfully`
    );
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},

  updateChemistCompanyWithCheComId: async (_: any, { input }: any,context : Context) => {
      try {
        if (!context || context.authError) {
      return createResponse(401, false, "Unauthorized");
    }
    if (!context.user?.companyId) {
      return createResponse(401, false, "Company not found");
    }
        const companyId = context.user.companyId;

        const { chemistCompanyId, email, phone, dob, anniversary, approxTarget } = input;

        const chemistCompany = await prisma.chemistCompany.findFirst({
          where: { id : chemistCompanyId, companyId },
        });

        if (!chemistCompany) {
          return createResponse(404, false, "ChemistCompany link not found");
        }

        const updatedChemistCompany = await prisma.chemistCompany.update({
          where: { id: chemistCompanyId },
          data: {
            email: email ?? chemistCompany.email,
            phone: phone ?? chemistCompany.phone,
            dob: dob || chemistCompany.dob,
            anniversary: anniversary || chemistCompany.anniversary,
            approxTarget: approxTarget ?? chemistCompany.approxTarget,
          },
           include: {
          chemist: { include: { address: true } }, 
          doctorChemist: {                         
            include: {
              doctorCompany: {
                include: {
                  doctor: { include: { address: true } }, 
                },
              },
            },
          },
        },
        });

        return { code: 200, success: true, message: "ChemistCompany updated successfully", 
          chemistCompany: updatedChemistCompany,
        };
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
 
    
  },
};
