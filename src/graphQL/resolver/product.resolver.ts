import { Context } from "../../context";
import { createResponse } from "../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ChemistResolvers = {
Query: {
    getProductById: async (_: any, { productId }: any, context: Context) => {
      try {
        if (!context || context.authError)
          return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id)
          return createResponse(400, false, "Company authorization required");

        const product = await prisma.product.findFirst({
          where: {
            id: productId,
            companyId: context.company.id,
          },
        });

        if (!product) return createResponse(404, false, "Product not found");

        return createResponse(200, true, "Product fetched successfully", { product });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getProductsByCompany: async (_: any, __: any, context: Context) => {
      try {
        if (!context || context.authError)
          return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id)
          return createResponse(400, false, "Company authorization required");

        const products = await prisma.product.findMany({
          where: { companyId: context.company.id },
        });

        return createResponse(200, true, "Products fetched successfully", { products });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getProductsByDoctor: async (_: any, { doctorId }: any, context: Context) => {
      try {
        if (!context || context.authError)
          return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id)
          return createResponse(400, false, "Company authorization required");

        const doctorProducts = await prisma.doctorProduct.findMany({
          where: { doctorId, companyId: context.company.id },
          include: { product: true },
        });

        return createResponse(200, true, "Doctor products fetched successfully", {
          doctorProducts,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getProductsByChemist: async (_: any, { chemistId }: any, context: Context) => {
      try {
        if (!context || context.authError)
          return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id)
          return createResponse(400, false, "Company authorization required");

        const chemistProducts = await prisma.chemistProduct.findMany({
          where: { chemistId, companyId: context.company.id },
          include: { product: true },
        });

        return createResponse(200, true, "Chemist products fetched successfully", {
         chemistProducts,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
  Mutation: {
    createProduct: async (_: any, { input }: any , context : Context) => {
      try {
        if(!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id) return createResponse(400, false, "Company authorization required");

        if (!input.name) return createResponse(400, false, "Name is required");
        if (!input.type) return createResponse(400, false, "Type is required");

        const product = await prisma.product.create({
          data: {
            name: input.name,
            type: input.type,
            salt: input.salt,
            details: input.details,
            companyId: context.company.id
          },
        });
        return createResponse(201, true, "Product created successfully", { product });
      } catch (err : any) {
        return createResponse(500, false, err.message);
      }
    },
    assignProductToDoctor: async (_: any, { input }: any , context : Context) => {
      try {
        if(!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id) return createResponse(400, false, "Company authorization required");
        const {id} = context.company
        const { doctorId, productId } = input;
        const existing = await prisma.doctorProduct.findFirst({
          where: { doctorId, productId , companyId : id},
        });

        if (existing) {
          return createResponse(400, false, "Product already assigned to this doctor");
        }

        const doctorProduct = await prisma.doctorProduct.create({
          data: { doctorId, productId , companyId : id},
        });

        return createResponse(201, true, "Product assigned to doctor successfully", { doctorProduct });
      } catch (err : any) {
        return createResponse(500, false, err.message);
      }
    },
    assignProductToChemist: async (_: any, { input }: any , context : Context) => {
      try {
        if(!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id) return createResponse(400, false, "Company authorization required");
        const {id} = context.company
        const { chemistId, productId } = input;
        const existing = await prisma.chemistProduct.findFirst({
          where: { chemistId, productId , companyId : id},
        });

        if (existing) {
          return createResponse(400, false, "Product already assigned to this chemist");
        }

        const chemistProduct = await prisma.chemistProduct.create({
          data: { chemistId, productId , companyId : id},
        });

        return createResponse(201, true, "Product assigned to chemist successfully", { chemistProduct });
      } catch (err : any) {
        return createResponse(500, false, err.message);
      }
    },
    updateProduct: async (_: any, { id, input }: any, context: Context) => {
      try {
        if (!context || context.authError)
          return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id)
          return createResponse(400, false, "Company authorization required");

        const product = await prisma.product.updateMany({
          where: { id, companyId: context.company.id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.type && { type: input.type }),
            ...(input.salt && { salt: input.salt }),
            ...(input.details && { details: input.details }),
          },
        });

        if (product.count === 0)
          return createResponse(404, false, "Product not found or unauthorized");

        return createResponse(200, true, "Product updated successfully");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    unassignProductFromDoctor: async (_: any, { doctorId, productId }: any, context: Context) => {
      try {
        if (!context || context.authError)
          return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id)
          return createResponse(400, false, "Company authorization required");

        const deleted = await prisma.doctorProduct.deleteMany({
          where: { doctorId, productId, companyId: context.company.id },
        });

        if (deleted.count === 0)
          return createResponse(404, false, "Product not assigned to this doctor");

        return createResponse(200, true, "Product unassigned from doctor successfully");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    unassignProductFromChemist: async (_: any, { chemistId, productId }: any, context: Context) => {
      try {
        if (!context || context.authError)
          return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id)
          return createResponse(400, false, "Company authorization required");

        const deleted = await prisma.chemistProduct.deleteMany({
          where: { chemistId, productId, companyId: context.company.id },
        });

        if (deleted.count === 0)
          return createResponse(404, false, "Product not assigned to this chemist");

        return createResponse(200, true, "Product unassigned from chemist successfully");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },

}

