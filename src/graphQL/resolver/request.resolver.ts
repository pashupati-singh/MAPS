import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";

const prisma = new PrismaClient();

export const RequestResolver = {
  Query: {
    getRequests: async (
      _: any,
      args: { page?: number; limit?: number },
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return createResponse(400, false, context?.authError || "Authorization Error");
        }

        if (!context.user && !context.company) {
          return createResponse(400, false, "User / Company authorization required");
        }

        const { userId, role, companyId: userCompanyId } = context.user || {};
        const companyId = context.company?.id || userCompanyId;

        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }
        const where: any = { companyId };
        if (userId && role === "MR") {
          where.userId = userId;
        }
        else if (userId && role === "ABM") {
          where.abmId = userId;
        }

        const page = args.page && args.page > 0 ? args.page : 1;
        const limit = args.limit && args.limit > 0 ? args.limit : 10;
        const skip = (page - 1) * limit;

        const total = await prisma.request.count({ where });
        const lastPage = Math.ceil(total / limit);

        const data = await prisma.request.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: "desc" },
        });

        return {
          code: 200,
          success: true,
          message: "Requests fetched successfully",
          data,
          lastPage,
        };
      } catch (err: any) {
        console.error("Error in getRequests:", err);
        return createResponse(500, false, err.message);
      }
    },
  },

  Mutation: {
    createRequest: async (_: any, { data }: any, context: Context) => {
  try {
    if (!context || !context.user) {
      return createResponse(400, false, "Invalid token or user");
    }

    const { userId, role, companyId: userCompanyId } = context.user;
    const companyId = context.company?.id || userCompanyId;

    if (!companyId) {
      return createResponse(400, false, "Company ID is missing");
    }

    if (role !== "MR") {
      return createResponse(400, false, "Only MRs can create requests");
    }

    const {
      abmId,
      requestType,
      name,
      startDate,
      endDate,
      productName,
      assoicateDoc,
      remark,
    } = data;

    if (!requestType || !name || !startDate || !endDate) {
      return createResponse(400, false, "requestType, name, startDate, endDate are required");
    }

    if (abmId) {
      const abmUser = await prisma.user.findFirst({
        where: { id: abmId, companyId, role: "ABM" },
      });
      if (!abmUser) {
        return createResponse(400, false, "Invalid ABM selected");
      }
    }

    const newRequest = await prisma.request.create({
      data: {
        userId,
        companyId,
        abmId: abmId || null,
        requestType,
        name,
        startDate,
        endDate,
        productName: productName || null,
        assoicateDoc: assoicateDoc || null,
        remark: remark || null,
      },
    });

    return createResponse(201, true, "Request created successfully", newRequest);
  } catch (err: any) {
    console.error("Error in createRequest:", err);
    return createResponse(500, false, err.message);
  }
},


    updateRequest: async (_: any, { data }: any, context: Context) => {
  try {
    if (!context || !context.user) {
      return createResponse(400, false, "Invalid token or user");
    }

    const { userId, role, companyId: userCompanyId } = context.user;
    const companyId = context.company?.id || userCompanyId;

    if (!companyId) {
      return createResponse(400, false, "Company authorization required");
    }

    if (role !== "MR") {
      return createResponse(400, false, "Only MRs can update requests");
    }

    const {
      requestId,
      abmId,
      requestType,
      name,
      startDate,
      endDate,
      productName,
      assoicateDoc,
      remark,
    } = data;

    if (!requestId) {
      return createResponse(400, false, "Request ID is required");
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return createResponse(404, false, "Request not found");
    }

    if (request.companyId !== companyId || request.userId !== userId) {
      return createResponse(403, false, "You are not authorized to update this request");
    }

    if (request.isApproved || request.isReject) {
      return createResponse(400, false, "Cannot update a request that is already processed");
    }

    if (abmId) {
      const abmUser = await prisma.user.findFirst({
        where: { id: abmId, companyId, role: "ABM" },
      });
      if (!abmUser) {
        return createResponse(400, false, "Invalid ABM selected");
      }
    }

    const updatedData: any = {};
    if (abmId !== undefined) updatedData.abmId = abmId;
    if (requestType !== undefined) updatedData.requestType = requestType;
    if (name !== undefined) updatedData.name = name;
    if (startDate !== undefined) updatedData.startDate = startDate;
    if (endDate !== undefined) updatedData.endDate = endDate;
    if (productName !== undefined) updatedData.productName = productName;
    if (assoicateDoc !== undefined) updatedData.assoicateDoc = assoicateDoc;
    if (remark !== undefined) updatedData.remark = remark;

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: updatedData,
    });

    return createResponse(200, true, "Request updated successfully", updated);
  } catch (err: any) {
    console.error("Error in updateRequest:", err);
    return createResponse(500, false, err.message);
  }
},

    deleteRequest: async (_: any, { requestId }: { requestId: number }, context: Context) => {
      try {
        if (!context || !context.user) {
          return createResponse(400, false, "Invalid token or user");
        }

        const { userId, role, companyId: userCompanyId } = context.user;
        const companyId = context.company?.id || userCompanyId;

        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        if (role !== "MR") {
          return createResponse(400, false, "Only MRs can delete requests");
        }

        if (!requestId) {
          return createResponse(400, false, "Request ID is required");
        }

        const request = await prisma.request.findUnique({
          where: { id: requestId },
        });

        if (!request) {
          return createResponse(404, false, "Request not found");
        }

        if (request.companyId !== companyId || request.userId !== userId) {
          return createResponse(403, false, "You are not authorized to delete this request");
        }

        if (request.isApproved || request.isReject) {
          return createResponse(400, false, "Cannot delete a request that is already processed");
        }

        await prisma.request.delete({ where: { id: requestId } });

        return createResponse(200, true, "Request deleted successfully");
      } catch (err: any) {
        console.error("Error in deleteRequest:", err);
        return createResponse(500, false, err.message);
      }
    },

    updateRequestApproval: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context || !context.user) {
          return createResponse(400, false, "Invalid token or user");
        }

        const { userId, role, companyId: userCompanyId } = context.user;
        const companyId = context.company?.id || userCompanyId;

        if (!companyId) {
          return createResponse(400, false, "Company authorization required");
        }

        if (role !== "ABM") {
          return createResponse(400, false, "Only ABMs can approve/reject requests");
        }

        const { requestId, isApproved, isReject } = data;

        if (!requestId) {
          return createResponse(400, false, "Request ID is required");
        }

        if (isApproved && isReject) {
          return createResponse(400, false, "Request cannot be both approved and rejected");
        }

        const request = await prisma.request.findUnique({
          where: { id: requestId },
        });

        if (!request) {
          return createResponse(404, false, "Request not found");
        }

        if (request.companyId !== companyId) {
          return createResponse(403, false, "Unauthorized to update this request");
        }

        if (request.abmId !== userId) {
          return createResponse(403, false, "You are not authorised to act on this request");
        }

        const updatedData: any = {};

        if (isApproved !== undefined) {
          updatedData.isApproved = isApproved;
          if (isApproved) updatedData.isReject = false;
        }

        if (isReject !== undefined) {
          updatedData.isReject = isReject;
          if (isReject) updatedData.isApproved = false;
        }

        const updated = await prisma.request.update({
          where: { id: requestId },
          data: updatedData,
        });

        return createResponse(200, true, "Request approval updated successfully", updated);
      } catch (err: any) {
        console.error("Error in updateRequestApproval:", err);
        return createResponse(500, false, err.message);
      }
    },
  },
};
