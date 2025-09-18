import { getLatLongFromAddress } from "../../utils/latlong";
import { createResponse } from "../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const DoctorResolvers = {
  Query: {
    doctors: async () => {
      try {
        const doctors = await prisma.doctor.findMany({
          include: {
            address: true,
            companies: { include: { company: true } },
            chemists: { include: { chemist: true } },
            products: true,
          },
        });
        return createResponse(200, true, "Doctors fetched successfully", {
          doctors,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message, { doctors: [] });
      }
    },

    doctor: async (_: any, { id }: any) => {
      try {
        const doctor = await prisma.doctor.findUnique({
          where: { id: Number(id) },
          include: {
            address: true,
            companies: { include: { company: true } },
            chemists: { include: { chemist: true } },
            products: true,
          },
        });

        if (!doctor) {
          return createResponse(404, false, "Doctor not found", { doctor: null });
        }

        return createResponse(200, true, "Doctor fetched successfully", {
          doctor,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message, { doctor: null });
      }
    },
  },

  Mutation: {
    createDoctor: async (_: any, { input }: any) => {
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
            data: { ...input.address, latitude, longitude },
          });
        }

        const doctor = await prisma.doctor.create({
          data: {
            name: input.name,
            titles: input.titles ?? [],
            status: input.status || "ACTIVE",
            addressId: addressRecord ? addressRecord.id : null,
          },
          include: { address: true },
        });

        if (input.companyId) {
          await prisma.doctorCompany.create({
            data: {
              doctorId: doctor.id,
              companyId: input.companyId,
              email: input.email,
              phone: input.phone,
              dob: input.dob ? new Date(input.dob) : null,
              anniversary: input.anniversary ? new Date(input.anniversary) : null,
              approxTarget: input.approxTarget,
            },
          });
        }

        return createResponse(201, true, "Doctor created successfully", {
          doctor,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    updateDoctor: async (_: any, { input }: any) => {
      try {
        const doctor = await prisma.doctor.findUnique({
          where: { id: Number(input.id) },
        });
        if (!doctor) return createResponse(404, false, "Doctor not found");

        let addressId = doctor.addressId;
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

        const updatedDoctor = await prisma.doctor.update({
          where: { id: Number(input.id) },
          data: {
            name: input.name ?? doctor.name,
            titles: input.titles ?? doctor.titles,
            status: input.status ?? doctor.status,
            addressId,
          },
          include: { address: true },
        });

        return createResponse(200, true, "Doctor updated successfully", {
          doctor: updatedDoctor,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    deleteDoctor: async (_: any, { id }: any) => {
      try {
        const doctor = await prisma.doctor.findUnique({ where: { id: Number(id) } });
        if (!doctor) {
          return createResponse(404, false, "Doctor not found", { doctor: null });
        }

        await prisma.doctorCompany.deleteMany({ where: { doctorId: doctor.id } });
        await prisma.doctorChemist.deleteMany({ where: { doctorId: doctor.id } });

        const deletedDoctor = await prisma.doctor.delete({
          where: { id: Number(id) },
          include: { address: true },
        });

        return createResponse(200, true, "Doctor deleted successfully", {
          doctor: deletedDoctor,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message, { doctor: null });
      }
    },

    updateDoctorCompany: async (_: any, { input }: any) => {
      try {
        const { doctorId, companyId, email, phone, dob, anniversary, approxTarget } = input;

        const doctorCompany = await prisma.doctorCompany.findFirst({
          where: { doctorId, companyId },
        });
        if (!doctorCompany) {
          return createResponse(404, false, "DoctorCompany link not found");
        }

        const updatedDoctorCompany = await prisma.doctorCompany.update({
          where: { id: doctorCompany.id },
          data: {
            email: email ?? doctorCompany.email,
            phone: phone ?? doctorCompany.phone,
            dob: dob ? new Date(dob) : doctorCompany.dob,
            anniversary: anniversary ? new Date(anniversary) : doctorCompany.anniversary,
            approxTarget: approxTarget ?? doctorCompany.approxTarget,
          },
        });

        return createResponse(200, true, "DoctorCompany updated successfully", {
          doctorCompany: updatedDoctorCompany,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    assignDoctorToCompany: async (_: any, { input }: any) => {
      try {
        const { doctorId, companyId, email, phone, dob, anniversary, approxTarget } = input;

        const existingLink = await prisma.doctorCompany.findFirst({
          where: { doctorId, companyId },
        });
        if (existingLink) {
          return createResponse(400, false, "Doctor is already assigned to this company");
        }

        const doctorCompany = await prisma.doctorCompany.create({
          data: {
            doctorId,
            companyId,
            email,
            phone,
            dob: dob ? new Date(dob) : null,
            anniversary: anniversary ? new Date(anniversary) : null,
            approxTarget,
          },
        });

        return createResponse(201, true, "Doctor assigned to company successfully", {
          doctorCompany,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    unassignDoctorFromCompany: async (_: any, { input }: any) => {
      try {
        const { doctorId, companyId } = input;

        const existingLink = await prisma.doctorCompany.findFirst({
          where: { doctorId, companyId },
        });
        if (!existingLink) {
          return createResponse(404, false, "Doctor is not assigned to this company");
        }

        await prisma.doctorCompany.delete({ where: { id: existingLink.id } });

        return createResponse(200, true, "Doctor unassigned from company successfully");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    assignDoctorToChemists: async (_: any, { input }: any) => {
      try {
        const { doctorId, chemistIds } = input;
        const doctorChemists: any[] = [];

        for (const chemistId of chemistIds) {
          const existingLink = await prisma.doctorChemist.findFirst({
            where: { doctorId, chemistId },
          });
          if (!existingLink) {
            const link = await prisma.doctorChemist.create({
              data: { doctorId, chemistId },
            });
            doctorChemists.push(link);
          }
        }

        return createResponse(201, true, "Doctor assigned to chemists successfully", {
          doctorChemists,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    unassignDoctorFromChemists: async (_: any, { input }: any) => {
      try {
        const { doctorId, chemistIds } = input;

        await prisma.doctorChemist.deleteMany({
          where: { doctorId, chemistId: { in: chemistIds } },
        });

        return createResponse(200, true, "Doctor unassigned from chemists successfully");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
