import { Context } from "../../context";
import { convertUTCToIST, nowIST } from "../../utils/ConvertUTCToIST";
import { createResponse } from "../../utils/response";
import { PrismaClient } from "@prisma/client";
import { FileUpload, uploadManyImages } from "../../utils/uploaderFunction";

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

        return {code : 200, success : true,  message : "Product fetched successfully",   product }
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getProductsByCompany: async (
  _: any,
  args: { page?: number; limit?: number; companyId?: number; search?: string },
  context: Context
) => {
  try {
    if (!context || context.authError) {
      return createResponse(400, false, context.authError || "Authorization Error");
    }
    if (!context?.user?.companyId) {
      return createResponse(400, false, "Company authorization required");
    }

    const companyId = context?.user?.companyId || args.companyId;
    const page = args.page && args.page > 0 ? args.page : 1;
    const limit = args.limit && args.limit > 0 ? args.limit : 10;
    const { search } = args;

    // 🔍 build dynamic where clause
    const where: any = { companyId };

    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { name:  { contains: term, mode: "insensitive" } },
        { type:  { contains: term, mode: "insensitive" } },
        { salt:  { contains: term, mode: "insensitive" } },
      ];
    }

    const total = await prisma.product.count({ where });
    const lastPage = Math.max(1, Math.ceil(total / limit));

    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
    });

    return {
      code: 200,
      success: true,
      message: "Products fetched successfully",
      data: products,
      lastPage,
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
          where: { chemistCompanyId : chemistId, companyId: context.company.id },
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
    createProduct: async (
  _: any,
  { input, images }: { input: any; images?: Promise<FileUpload>[] },
  context: Context
) => {

      try {
        if(!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
        if (!context?.user?.companyId) return createResponse(400, false, "Company authorization required");
        const companyId = context?.user?.companyId
        if (!input.name) return createResponse(400, false, "Name is required");
        if (!input.type) return createResponse(400, false, "Type is required");
         if (images && images.length > 10) {
      return createResponse(400, false, "Maximum 10 images allowed per request");
    }


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
     const imageUrls = await uploadManyImages(images);
      await prisma.product.create({
          data: {
            name: input.name,
            type: input.type,
            salt: input.salt,
            details: input.details,
            companyId,
            images: imageUrls,
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
    const dateTime = nowIST();
    const alreadyAssignedIds = existingLinks.map((e) => e.productId);
    const newProductIds = productIds.filter((id: number) => !alreadyAssignedIds.includes(id));
    const createdLinks = await prisma.$transaction(
      newProductIds.map((productId: number) =>
        prisma.doctorProduct.create({
          data: {
            doctorCompanyId,
            productId,
            companyId,
            assignedAt : new Date(dateTime)
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

assignProductToChemist: async (_: any, { input }: any, context: Context) => {
  try {
    if (!context || context.authError) {
      return createResponse(400, false, context.authError || "Authorization Error");
    }
    if (!context.user?.companyId) {
      return createResponse(400, false, "Company authorization required");
    }
    
    const companyId = context?.user?.companyId;
    const { chemistCompanyId, productIds } = input;
 
    const existingLinks = await prisma.chemistProduct.findMany({
      where: {
        chemistCompanyId,
        productId: { in: productIds },
        companyId,
      },
    });
    const dateTime = nowIST();
    const alreadyAssignedIds = existingLinks.map((e) => e.productId);

    const newProductIds = productIds.filter((id: number) => !alreadyAssignedIds.includes(id));
    const createdLinks = await prisma.$transaction(
      newProductIds.map((productId: number) =>
        prisma.chemistProduct.create({
          data: {
            chemistCompanyId,
            productId,
            companyId,
            assignedAt : new Date(dateTime)
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

unassignProductFromDoctor: async (_: any, { doctorProductIds }: any, context: Context) => {
  try {
    if (!context || context.authError)
      return createResponse(400, false, context.authError || "Authorization Error");
    if (!context?.user?.companyId)
      return createResponse(400, false, "Company authorization required");

    const deleted = await prisma.doctorProduct.deleteMany({
      where: {
        id: { in: doctorProductIds },
        companyId: context?.user?.companyId
      },
    });

    if (deleted.count === 0)
      return createResponse(404, false, "No doctor products found to unassign");

    return createResponse(200, true, `${deleted.count} product(s) unassigned from doctor`);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},
unassignProductFromChemist: async (_: any, { chemistProductIds }: any, context: Context) => {
  try {
    if (!context || context.authError)
      return createResponse(400, false, context.authError || "Authorization Error");
    if (!context?.user?.companyId)
      return createResponse(400, false, "Company authorization required");

    const deleted = await prisma.chemistProduct.deleteMany({
      where: {
        id: { in: chemistProductIds },
        companyId : context?.user?.companyId,
      },
    });

    if (deleted.count === 0)
      return createResponse(404, false, "No chemist products found to unassign");

    return createResponse(200, true, `${deleted.count} product(s) unassigned from chemist`);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},

updateProduct: async (
  _: any,
  { id, input, images }: { id: number; input: any; images?: Promise<FileUpload>[] },
  context: Context
) => {
  try {
    if (!context || context.authError)
      return createResponse(400, false, context.authError || "Authorization Error");
    if (!context.company?.id)
      return createResponse(400, false, "Company authorization required");
    if (images && images.length > 10) {
      return createResponse(400, false, "Maximum 10 images allowed per request");
    }

    const imageUrls = await uploadManyImages(images); 

    const data: any = {
      ...(input.name && { name: input.name }),
      ...(input.type && { type: input.type }),
      ...(input.salt && { salt: input.salt }),
      ...(input.details && { details: input.details }),
    };

    if (imageUrls.length > 0) {
      data.images = imageUrls;
    }

    const product = await prisma.product.updateMany({
      where: { id, companyId: context.company.id },
      data,
    });

    if (product.count === 0)
      return createResponse(404, false, "Product not found or unauthorized");

    return createResponse(200, true, "Product updated successfully");
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},


  },

}

