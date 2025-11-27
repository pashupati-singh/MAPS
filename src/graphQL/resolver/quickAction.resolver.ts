import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";
import GraphQLJSON from "graphql-type-json";

const prisma = new PrismaClient();

export const QuickActionResolver = {
  JSON: GraphQLJSON,

  Mutation: {
    createQuickAction: async (
      _: any,
      { data }: { data: { quickAction: any } },
      context: Context
    ) => {
      try {
        if (!context || context.authError) {
          return createResponse(400, false, context?.authError || "Authorization Error");
        }

        const userId = context.user?.userId;
        const companyId = context.user?.companyId;

        if (!userId) return createResponse(400, false, "User authorization required");
        if (!companyId) return createResponse(400, false, "Company authorization required");

        const existing = await prisma.quickAction.findFirst({
          where: { userId, companyId },
        });

        let result;

        if (!existing) {
          result = await prisma.quickAction.create({
            data: {
              userId,
              companyId,
              quickAction: data.quickAction,
            },
          });
          return createResponse(201, true, "Quick action created successfully", result);
        } else {
          result = await prisma.quickAction.update({
            where: { id: existing.id },
            data: {
              quickAction: data.quickAction,
            },
          });
          return createResponse(200, true, "Quick action updated successfully", result);
        }
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
