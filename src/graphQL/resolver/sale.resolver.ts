import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const SaleResolvers = {
  Query: {
    // Get sales within date range
    async getSalesReport(_: any, args: { companyId: number; startDate: string; endDate: string }) {
      const { companyId, startDate, endDate } = args;

      const sales = await prisma.sale.findMany({
        where: {
          companyId,
          orderDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      });

      const totalAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalQty = sales.reduce((sum, s) => sum + s.qty, 0);

      return {
        totalAmount,
        totalQty,
        sales,
      };
    },

    async getSaleById(_: any, args: { id: number }) {
      const sale = await prisma.sale.findUnique({
        where: { id: args.id },
      });

      if (!sale) {
        return {
          code: 404,
          success: false,
          message: "Sale not found",
          data: null,
        };
      }

      return {
        code: 200,
        success: true,
        message: "Sale fetched successfully",
        data: sale,
      };
    },
  },

  Mutation: {
    async createSale(_: any, args: { data: any }) {
      const { data } = args;

      const totalAmount = data.qty * data.price;

      const sale = await prisma.sale.create({
        data: {
          ...data,
          totalAmount,
        },
      });

      return {
        code: 201,
        success: true,
        message: "Sale created successfully",
        data: sale,
      };
    },
  },
};
