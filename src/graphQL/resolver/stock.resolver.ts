import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";
import { MidTimeDate } from "../../utils/midTimeDate";

const prisma = new PrismaClient();

export const StockResolver = {
   Stock: {
    color: (parent: any) => {
      if (parent.qty <= parent.minAvailability) {
        return "red";
      }
      return "green";
    },
  },
  Query: {
   
    getStockById: async (_: any, { id }: { id: number }) => {
      try {
        if (!id) return createResponse(400, false, "Stock ID is required");

        const stock = await prisma.stock.findUnique({ where: { id } });
        if (!stock) return createResponse(404, false, "Stock not found");

        return createResponse(200, true, "Stock fetched successfully", stock);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getStocksByMr: async (_: any, { mrId }: { mrId: number }) => {
      try {
        if (!mrId) return createResponse(400, false, "MR ID is required");

        const stocks = await prisma.stock.findMany({ where: { mrId } });
        return createResponse(200, true, "Stocks fetched successfully", stocks);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getStocksByDoctor: async (_: any, { doctorId }: { doctorId: number }) => {
      try {
        if (!doctorId) return createResponse(400, false, "Doctor ID is required");

        const stocks = await prisma.stock.findMany({ where: { doctorId } });
        return createResponse(200, true, "Stocks fetched successfully", stocks);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getStocksByChemist: async (_: any, { chemistId }: { chemistId: number }) => {
      try {
        if (!chemistId) return createResponse(400, false, "Chemist ID is required");

        const stocks = await prisma.stock.findMany({ where: { chemistId } });
        return createResponse(200, true, "Stocks fetched successfully", stocks);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    getStocksByProduct: async (_: any, { productId }: { productId: number }) => {
      try {
        if (!productId) return createResponse(400, false, "Product ID is required");

        const stocks = await prisma.stock.findMany({ where: { productId } });
        return createResponse(200, true, "Stocks fetched successfully", stocks);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },

//   Mutation: {
//     createStock: async (_: any, { data }: any) => {
//       try {
//         const {
//           mrId,
//           doctorId,
//           chemistId,
//           productId,
//           qty,
//           dateOfUpdate,
//           dateOfReminder,
//         } = data;
//         if (!doctorId && !chemistId) {
//           return createResponse(400, false, "Either doctorId or chemistId is required");
//         }
//         if (doctorId && chemistId) {
//           return createResponse(400, false, "Cannot assign both doctor and chemist");
//         }

//         const stock = await prisma.stock.create({
//           data: {
//             mrId,
//             doctorId,
//             chemistId,
//             productId,
//             qty,
//             dateOfUpdate: dateOfUpdate,
//             dateOfReminder: dateOfReminder
//           },
//         });

//         return createResponse(201, true, "Stock created successfully", stock);
//       } catch (err: any) {
//         return createResponse(500, false, err.message);
//       }
//     },

//     updateStock: async (_: any, { id, mrId, qty, dateOfUpdate, dateOfReminder }: any) => {
//   try {
//     if (!id) return createResponse(400, false, "Stock ID is required");
//     if (!mrId) return createResponse(400, false, "MR ID is required");

//     // ✅ Check stock ownership
//     const stock = await prisma.stock.findUnique({ where: { id } });
//     if (!stock) return createResponse(404, false, "Stock not found");

//     if (stock.mrId !== mrId) {
//       return createResponse(403, false, "You are not allowed to update this stock");
//     }

//     // ✅ Update fields
//     const updatedStock = await prisma.stock.update({
//       where: { id },
//       data: {
//         qty: qty ?? stock.qty,
//         dateOfUpdate: dateOfUpdate ? new Date(dateOfUpdate) : new Date(),
//         dateOfReminder: dateOfReminder ? new Date(dateOfReminder) : stock.dateOfReminder,
//       },
//     });

//     return createResponse(200, true, "Stock updated successfully", updatedStock);
//   } catch (err: any) {
//     return createResponse(500, false, err.message);
//   }
// },

//   },

 Mutation: {
    createStock: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context?.user) return createResponse(400, false, "User not authenticated");
        if (context.user.role !== "MR") return createResponse(403, false, "Only MR can create stock");
        if (!context.company?.id) return createResponse(400, false, "Company ID is missing");

        const { doctorId, chemistId, productId, qty, minAvailability, dateOfReminder } = data;

        if (!doctorId && !chemistId) {
          return createResponse(400, false, "Either doctorId or chemistId is required");
        }
        if (doctorId && chemistId) {
          return createResponse(400, false, "Cannot assign both doctor and chemist");
        }
        if(!productId){
          return createResponse(400, false, "Product is required");
        }

        const reminderDate = dateOfReminder ? new Date(dateOfReminder.split("T")[0]) : null;
        const dateOfUpdate = MidTimeDate();
        const stock = await prisma.stock.create({
          data: {
            mrId: context.user.userId,
            doctorId,
            chemistId,
            productId,
            qty,
            minAvailability,
            dateOfUpdate,
            dateOfReminder: reminderDate,
          },
        });

        return createResponse(201, true, "Stock created successfully", stock);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    updateStock: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context?.user) return createResponse(400, false, "User not authenticated");
        if (context.user.role !== "MR") return createResponse(403, false, "Only MR can update stock");

        const { id, qty, minAvailability, dateOfReminder } = data;

        const stock = await prisma.stock.findUnique({ where: { id } });
        if (!stock) return createResponse(404, false, "Stock not found");
        if (stock.mrId !== context.user.userId) {
          return createResponse(403, false, "You are not allowed to update this stock");
        }

        const reminderDate = dateOfReminder ? new Date(dateOfReminder.split("T")[0]) : stock.dateOfReminder;

        const updatedStock = await prisma.stock.update({
          where: { id },
          data: {
            qty: qty ?? stock.qty,
            minAvailability: minAvailability ?? stock.minAvailability,
            dateOfUpdate: MidTimeDate(),
            dateOfReminder: reminderDate,
          },
        });

        return createResponse(200, true, "Stock updated successfully", updatedStock);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
