import { Context } from "../../context";
import { createResponse } from "../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ProductResolvers = {
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
    if (!context || context.authError) {
      return createResponse(400, false, context.authError || "Authorization Error");
    }
    if (!context?.user?.companyId) {
      return createResponse(400, false, "Company authorization required");
    }

    const companyId = context?.user?.companyId;

    const products = await prisma.product.findMany({
      where: { companyId },
    });

   return {
  code: 200,
  success: true,
  message: "Products fetched successfully",
  product: products,
};
  } catch (err: any) {
    return createResponse(500, false, err.message, { product: [] });
  }
},


    getProductsByDoctor: async (_: any, { doctorId }: any, context: Context) => {
      try {
        if (!context || context.authError)
          return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id)
          return createResponse(400, false, "Company authorization required");

        const doctorProducts = await prisma.doctorProduct.findMany({
          where: { doctorCompanyId : doctorId, companyId: context.company.id },
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
        if (!context?.user?.companyId) return createResponse(400, false, "Company authorization required");
        const companyId = context?.user?.companyId
        if (!input.name) return createResponse(400, false, "Name is required");
        if (!input.type) return createResponse(400, false, "Type is required");

         const existingProduct = await prisma.product.findFirst({
      where: {
        name: input.name,
        type: input.type,
        salt: input.salt,
        companyId,
      },
    });

    if (existingProduct) {
      return createResponse(400, false, "Product already exists with the same name, type, and salt in this company.");
    }
      await prisma.product.create({
          data: {
            name: input.name,
            type: input.type,
            salt: input.salt,
            details: input.details,
            companyId,
          },
        });
        return createResponse(201, true, "Product created successfully");
      } catch (err : any) {
        return createResponse(500, false, err.message);
      }
    },
assignProductToDoctor: async (_: any, { input }: any, context: Context) => {
  try {
    if (!context || context.authError) {
      return createResponse(400, false, context.authError || "Authorization Error");
    }
    if (!context.user?.companyId) {
      return createResponse(400, false, "Company authorization required");
    }

    const companyId = context.user.companyId;
    const { doctorCompanyId, productIds } = input;

    const existingLinks = await prisma.doctorProduct.findMany({
      where: {
        doctorCompanyId,
        productId: { in: productIds },
        companyId,
      },
    });

    const alreadyAssignedIds = existingLinks.map((e) => e.productId);

    const newProductIds = productIds.filter((id: number) => !alreadyAssignedIds.includes(id));

    const createdLinks = await prisma.$transaction(
      newProductIds.map((productId: number) =>
        prisma.doctorProduct.create({
          data: {
            doctorCompanyId,
            productId,
            companyId,
          },
        })
      )
    );

    return {
      code: 201,
      success: true,
      message: "Products assigned successfully",
      created: createdLinks,
    };
  } catch (err: any) {
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
          where: { doctorCompanyId: doctorId, productId, companyId: context.company.id },
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

