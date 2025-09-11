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
      ].filter(Boolean).join(", ");

      let latitude = null;
      let longitude = null;

      try {
        const coords = await getLatLongFromAddress(fullAddress);
        latitude = coords.latitude;
        longitude = coords.longitude;
      } catch (error : any) {
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
    if (input.companyId) {
      await prisma.chemistCompany.create({
        data: {
          chemistId: chemist.id,
          companyId: input.companyId,
        },
      });
    }
    if (input.doctorId) {
      await prisma.doctorChemist.create({
        data: {
          chemistId: chemist.id,
          doctorId: input.doctorId,
        },
      });
    }

    return createResponse(201, true, "Chemist created successfully", { chemist });
  } catch (err : any) {
    return createResponse(500, false, err.message);
  }
},

assignChemistToCompany: async (_: any, { input }: any) => {
  try {
    const { chemistId, companyId } = input;
    const existingLink = await prisma.chemistCompany.findFirst({
      where: {
        chemistId,
        companyId,
      },
    });

    if (existingLink) {
      return createResponse(400, false, "Chemist is already assigned to this company");
    }
    const chemistCompany = await prisma.chemistCompany.create({
      data: {
        chemistId,
        companyId,
      },
    });

    return createResponse(201, true, "Chemist assigned to company successfully", { chemistCompany });
  } catch (err :any) {
    return createResponse(500, false, err.message);
  }
},

unassignChemistFromCompany: async (_: any, { input }: any) => {
  try {
    const { chemistId, companyId } = input;
    const existingLink = await prisma.chemistCompany.findFirst({
      where: {
        chemistId,
        companyId,
      },
    });

    if (!existingLink) {
      return createResponse(404, false, "Chemist is not assigned to this company");
    }
    await prisma.chemistCompany.delete({
      where: {
        id: existingLink.id,
      },
    });

    return createResponse(200, true, "Chemist unassigned from company successfully");
  } catch (err:any) {
    return createResponse(500, false, err.message);
  }
},

assignDoctorToChemist: async (_: any, { input }: any) => {
  try {
    const { doctorId, chemistId } = input;
    const existingLink = await prisma.doctorChemist.findFirst({
      where: {
        doctorId,
        chemistId,
      },
    });

    if (existingLink) {
      return createResponse(400, false, "Doctor is already assigned to this chemist");
    }
    const doctorChemist = await prisma.doctorChemist.create({
      data: {
        doctorId,
        chemistId,
      },
    });

    return createResponse(201, true, "Doctor assigned to chemist successfully", { doctorChemist });
  } catch (err:any) {
    return createResponse(500, false, err.message);
  }
},

unassignDoctorFromChemist: async (_: any, { input }: any) => {
  try {
    const { doctorId, chemistId } = input;
    const existingLink = await prisma.doctorChemist.findFirst({
      where: {
        doctorId,
        chemistId,
      },
    });

    if (!existingLink) {
      return createResponse(404, false, "Doctor is not assigned to this chemist");
    }
    await prisma.doctorChemist.delete({
      where: {
        id: existingLink.id,
      },
    });

    return createResponse(200, true, "Doctor unassigned from chemist successfully");
  } catch (err:any) {
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
