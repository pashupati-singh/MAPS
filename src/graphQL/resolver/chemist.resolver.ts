import { getLatLongFromAddress } from "../../utils/latlong";
import { createResponse } from "../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ChemistResolvers = {
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
            email: input.email,
            phone: input.phone,
            status: input.status || "ACTIVE",
            addressId: addressRecord ? addressRecord.id : null,
          },
          include: { address: true },
        });

        return createResponse(201, true, "Chemist created successfully", { chemist });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    updateChemist: async (_: any, { input }: any) => {
      try {
        const chemist = await prisma.chemist.findUnique({ where: { id: Number(input.id) } });
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

        const updatedChemist = await prisma.chemist.update({
          where: { id: Number(input.id) },
          data: {
            name: input.name ?? chemist.name,
            titles: input.titles ?? chemist.titles,
            email: input.email ?? chemist.email,
            phone: input.phone ?? chemist.phone,
            status: input.status ?? chemist.status,
            addressId,
          },
          include: { address: true },
        });

        return createResponse(200, true, "Chemist updated successfully", { chemist: updatedChemist });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
