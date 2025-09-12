import { createResponse } from "../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ChemistResolvers = {

  Mutation: {
    createProduct: async (_: any, { input }: any) => {
      try {
        const product = await prisma.product.create({
          data: {
            name: input.name,
            type: input.type,
            salt: input.salt,
            details: input.details,
            companyId: input.companyId,
          },
        });
        return createResponse(201, true, "Product created successfully", { product });
      } catch (err : any) {
        return createResponse(500, false, err.message);
      }
    },
    assignProductToDoctor: async (_: any, { input }: any) => {
      try {
        const { doctorId, productId } = input;
        const existing = await prisma.doctorProduct.findFirst({
          where: { doctorId, productId },
        });

        if (existing) {
          return createResponse(400, false, "Product already assigned to this doctor");
        }

        const doctorProduct = await prisma.doctorProduct.create({
          data: { doctorId, productId },
        });

        return createResponse(201, true, "Product assigned to doctor successfully", { doctorProduct });
      } catch (err : any) {
        return createResponse(500, false, err.message);
      }
    },
    assignProductToChemist: async (_: any, { input }: any) => {
      try {
        const { chemistId, productId } = input;
        const existing = await prisma.chemistProduct.findFirst({
          where: { chemistId, productId },
        });

        if (existing) {
          return createResponse(400, false, "Product already assigned to this chemist");
        }

        const chemistProduct = await prisma.chemistProduct.create({
          data: { chemistId, productId },
        });

        return createResponse(201, true, "Product assigned to chemist successfully", { chemistProduct });
      } catch (err : any) {
        return createResponse(500, false, err.message);
      }
    },
  },

}

