import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { getLatLongFromAddress } from "../../utils/latlong";

const prisma = new PrismaClient();

export const DoctorResolver = {
  Query: {
    doctors: async () => {
      return await prisma.doctor.findMany({
        include: { address: true, companies: true, chemists: true, products: true },
      });
    },
    doctor: async (_: any, { id }: { id: number }) => {
      return await prisma.doctor.findUnique({
        where: { id },
        include: { address: true, companies: true, chemists: true, products: true },
      });
    },
  },

  Mutation: {
    createDoctor: async (_: any, { input }: any) => {
      try {
        let addressRecord = null;

        if (input.address) {
          const fullAddress = [input.address.address,input.address.city,input.address.state,input.address.pinCode,
            input.address.country,input.address.landmark,].filter(Boolean).join(", ");
          let latitude: number | null = null;
          let longitude: number | null = null;

          try {
            const coords = await getLatLongFromAddress(fullAddress);
            latitude = coords.latitude;
            longitude = coords.longitude;
          } catch (error: any) {
            return createResponse(400, false, `Failed to fetch coordinates: ${error.message}`);
          }
          addressRecord = await prisma.address.create({
            data: {
              address: input.address.address,
              city: input.address.city,
              state: input.address.state,
              pinCode: input.address.pinCode,
              country: input.address.country,
              landmark: input.address.landmark,
              latitude,
              longitude,
            },
          });
        }
        const doctor = await prisma.doctor.create({
          data: {
            name: input.name,
            titles: input.titles ?? [],
            email: input.email,
            phone: input.phone,
            status: input.status || "ACTIVE",
            addressId: addressRecord ? addressRecord.id : null,
          },
          include: { address: true },
        });

        return createResponse(201, true, "Doctor created successfully", { doctor });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

     updateDoctor: async (_: any, { input }: any) => {
      try {
        const doctor = await prisma.doctor.findUnique({ where: { id: Number(input.id) } });
        if (!doctor) return createResponse(404, false, "Doctor not found");

        let addressId = doctor.addressId;

        if (input.address) {
          const fullAddress = [input.address.address,input.address.city,input.address.state,input.address.pinCode,
         input.address.country, input.address.landmark,].filter(Boolean).join(", ");

          let latitude: number | null = null;
          let longitude: number | null = null;

          try {
            const coords = await getLatLongFromAddress(fullAddress);
            latitude = coords.latitude;
            longitude = coords.longitude;
          } catch (error: any) {
            return createResponse(400, false, `Failed to fetch coordinates: ${error.message}`);
          }

          if (addressId) {
            await prisma.address.update({
              where: { id: addressId },
              data: {
                ...input.address,
                latitude,
                longitude,
              },
            });
          } else {
            const newAddress = await prisma.address.create({
              data: {
                ...input.address,
                latitude,
                longitude,
              },
            });
            addressId = newAddress.id;
          }
        }

        const updatedDoctor = await prisma.doctor.update({
          where: { id: Number(input.id) },
          data: {
            name: input.name ?? doctor.name,
            titles: input.titles ?? doctor.titles,
            email: input.email ?? doctor.email,
            phone: input.phone ?? doctor.phone,
            status: input.status ?? doctor.status,
            addressId,
          },
          include: { address: true },
        });

        return createResponse(200, true, "Doctor updated successfully", { doctor: updatedDoctor });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    deleteDoctor: async (_: any, { id }: { id: number }) => {
      try {
        const doctor = await prisma.doctor.findUnique({ where: { id } });
        if (!doctor) return createResponse(404, false, "Doctor not found");

        await prisma.doctor.delete({ where: { id } });

        return createResponse(200, true, "Doctor deleted successfully", { doctor });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
