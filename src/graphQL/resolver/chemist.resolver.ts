import { Context } from "../../context";
import { getLatLongFromAddress } from "../../utils/latlong";
import { createResponse } from "../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ChemistResolvers = {
   Query: {
    chemists: async () => {
      try {
        const chemists = await prisma.chemist.findMany({
          include: {
            address: true,
            companies: {
              include: { company: true }, // include related company details
            },
            doctors: true,
            products: true,
          },
        });
        return {
          code: 200,
          success: true,
          message: "Chemists fetched successfully",
          chemists,
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
    createChemist: async (_: any, { input }: any) => {
      try {
        let addressRecord = null;
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

          let latitude = null;
          let longitude = null;

          try {
            const coords = await getLatLongFromAddress(fullAddress);
            latitude = coords.latitude;
            longitude = coords.longitude;
          } catch (error: any) {
            return createResponse(
              400,
              false,
              `Failed to fetch coordinates: ${error.message}`
            );
          }

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
          },
          include: { address: true },
        });

        if (input.companyId) {
          await prisma.chemistCompany.create({
            data: {
              chemistId: chemist.id,
              companyId: input.companyId,
              email: input.email,
              phone: input.phone,
              dob: input.dob ? new Date(input.dob) : null,
              anniversary: input.anniversary ? new Date(input.anniversary) : null,
              approxTarget: input.approxTarget,
            },
          });
        }

        if (input.doctorId) {
          await prisma.doctorChemist.create({
            data: {
              chemistId: chemist.id,
              doctorId: input.doctorId,
              companyId: input.companyId,
            },
          });
        }

        return createResponse(201, true, "Chemist created successfully", {
          chemist,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
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
            dob: dob ? new Date(dob) : null,
            anniversary: anniversary ? new Date(anniversary) : null,
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

    updateChemist: async (_: any, { input }: any) => {
      try {
        const chemist = await prisma.chemist.findUnique({
          where: { id: Number(input.id) },
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

          let latitude: number | null = null;
          let longitude: number | null = null;

          try {
            const coords = await getLatLongFromAddress(fullAddress);
            latitude = coords.latitude;
            longitude = coords.longitude;
          } catch (error: any) {
            return createResponse(
              400,
              false,
              `Failed to fetch coordinates: ${error.message}`
            );
          }

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
          where: { id: Number(input.id) },
          data: {
            name: input.name ?? chemist.name,
            titles: input.titles ?? chemist.titles,
            status: input.status ?? chemist.status,
            addressId,
          },
          include: { address: true },
        });

        return createResponse(200, true, "Chemist updated successfully", {
          chemist: updatedChemist,
        });
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
            dob: dob ? new Date(dob) : chemistCompany.dob,
            anniversary: anniversary ? new Date(anniversary) : chemistCompany.anniversary,
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
