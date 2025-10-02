import { Context } from "../../context";
import { getLatLongFromAddress } from "../../utils/latlong";
import { createResponse } from "../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ChemistResolvers = {
   Query: {
    chemists: async (_: any,args: { page?: number; limit?: number },context: Context) => {
      try {
        if(!context || context.authError) return createResponse(401, false, "Unauthorized");
        if(!context.user?.companyId) return createResponse(401, false, "Company not found");
        const page = args.page && args.page > 0 ? args.page : 1;
        const limit = args.limit && args.limit > 0 ? args.limit : 10;
        
        const totalUsers = await prisma.chemistCompany.count({ where: { companyId : context.user?.companyId } });
        
        const lastPage = Math.ceil(totalUsers / limit);
        const chemists = await prisma.chemistCompany.findMany({
           where : { companyId : context.user?.companyId},
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { id: "asc" },
          include: {
            chemist: {
              include: {
                address: true,
                companies: {
                  include: { company: true },
                },
                doctors: true,
                products: true,
              },
            },
          }
        });
        console.log(chemists);
        return {
          code: 200,
          success: true,
          message: "Chemists fetched successfully",
          chemists,
          lastPage
        };
      } catch (err: any) {
        return {
          code: 500,
          success: false,
          message: err.message,
          chemists: [],
        };
      }
    },

    chemist: async (_: any, { id }: any) => {
      try {
        const chemist = await prisma.chemist.findUnique({
          where: { id: Number(id) },
          include: {
            address: true,
            companies: {
              include: { company: true },
            },
            doctors: true,
            products: true,
          },
        });
        if (!chemist) {
          return {
            code: 404,
            success: false,
            message: "Chemist not found",
            chemist: null,
          };
        }
        return {
          code: 200,
          success: true,
          message: "Chemist fetched successfully",
          chemist,
        };
      } catch (err: any) {
        return {
          code: 500,
          success: false,
          message: err.message,
          chemist: null,
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
  assignChemistToCompany: async (_: any, { input }: any) => {
      try {
        const { chemistId, companyId, email, phone, dob, anniversary, approxTarget } = input;

        const existingLink = await prisma.chemistCompany.findFirst({
          where: { chemistId, companyId },
        });

        if (existingLink) {
          return createResponse(
            400,
            false,
            "Chemist is already assigned to this company"
          );
        }

        const chemistCompany = await prisma.chemistCompany.create({
          data: {
            chemistId,
            companyId,
            email,
            phone,
            dob: dob || null,
            anniversary: anniversary|| null,
            approxTarget,
          },
        });

        return createResponse(
          201,
          true,
          "Chemist assigned to company successfully",
          { chemistCompany }
        );
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    unassignChemistFromCompany: async (_: any, { input }: any) => {
      try {
        const { chemistId, companyId } = input;
        const existingLink = await prisma.chemistCompany.findFirst({
          where: { chemistId, companyId },
        });

        if (!existingLink) {
          return createResponse(
            404,
            false,
            "Chemist is not assigned to this company"
          );
        }

        await prisma.chemistCompany.delete({ where: { id: existingLink.id } });

        return createResponse(
          200,
          true,
          "Chemist unassigned from company successfully"
        );
      } catch (err: any) {
        return createResponse(500, false, err.message);
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

    updateChemistCompany: async (_: any, { input }: any) => {
      try {
        const { chemistId, companyId, email, phone, dob, anniversary, approxTarget } = input;

        const chemistCompany = await prisma.chemistCompany.findFirst({
          where: { chemistId, companyId },
        });

        if (!chemistCompany) {
          return createResponse(404, false, "ChemistCompany link not found");
        }

        const updatedChemistCompany = await prisma.chemistCompany.update({
          where: { id: chemistCompany.id },
          data: {
            email: email ?? chemistCompany.email,
            phone: phone ?? chemistCompany.phone,
            dob: dob || chemistCompany.dob,
            anniversary: anniversary || chemistCompany.anniversary,
            approxTarget: approxTarget ?? chemistCompany.approxTarget,
          },
        });

        return createResponse(200, true, "ChemistCompany updated successfully", {
          chemistCompany: updatedChemistCompany,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
 
    assignDoctorToChemist: async (_: any, { input }: any , context : Context) => {
      try {
        if(!context.company || context.authError) return createResponse(401, false, "Unauthorized");
        const { doctorId, chemistId } = input;
        const {id} = context.company
        const existingLink = await prisma.doctorChemist.findFirst({
          where: { doctorId, chemistId , companyId : id},
        });

        if (existingLink) {
          return createResponse(
            400,
            false,
            "Doctor is already assigned to this chemist"
          );
        }

        const doctorChemist = await prisma.doctorChemist.create({
          data: { doctorId, chemistId , companyId : id},
        });

        return createResponse(
          201,
          true,
          "Doctor assigned to chemist successfully",
          { doctorChemist }
        );
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    unassignDoctorFromChemist: async (_: any, { input }: any , context : Context) => {
      try {
        if(!context.company || context.authError) return createResponse(401, false, "Unauthorized");
        const {id} = context.company
        const { doctorId, chemistId } = input;
        const existingLink = await prisma.doctorChemist.findFirst({
          where: { doctorId, chemistId , companyId : id},
        });

        if (!existingLink) {
          return createResponse(
            404,
            false,
            "Doctor is not assigned to this chemist"
          );
        }

        await prisma.doctorChemist.delete({ where: { id: existingLink.id } });

        return createResponse(
          200,
          true,
          "Doctor unassigned from chemist successfully"
        );
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    deleteChemist: async (_: any, { id }: any) => {
      try {
        const chemist = await prisma.chemist.findUnique({ where: { id: Number(id) } });
        if (!chemist) {
          return {
            code: 404,
            success: false,
            message: "Chemist not found",
            chemist: null,
          };
        }
        await prisma.chemistCompany.deleteMany({
          where: { chemistId: chemist.id },
        });

        await prisma.doctorChemist.deleteMany({
          where: { chemistId: chemist.id },
        });

        const deletedChemist = await prisma.chemist.delete({
          where: { id: Number(id) },
          include: { address: true },
        });

        return {
          code: 200,
          success: true,
          message: "Chemist deleted successfully",
          chemist: deletedChemist,
        };
      } catch (err: any) {
        return {
          code: 500,
          success: false,
          message: err.message,
          chemist: null,
        };
      }
    },
  },
};
