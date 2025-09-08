import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";

const prisma = new PrismaClient();

export const CompanyResolver = {
    Query: {
    companies: async () => {
      return await prisma.company.findMany();
    },
    company: async (_: any, { id }: { id: number }) => {
      return await prisma.company.findUnique({ where: { id } });
    },
  },
  Mutation: {
    addCompany: async (_: any, { data }: any) => {
      try {
        if (!data) {
          return createResponse(400, false, "Please provide data");
        }
        if (!data.email) {
          return createResponse(404, false, "Email is required");
        }

        const newCompany = await prisma.company.create({
          data: {
            name: data.name,
            legalName: data.legalName,
            size: data.size,
            website: data.website,
            logoUrl: data.logoUrl,
            status: data.status || "ACTIVE",
            gstNumber: data.gstNumber,
            registrationNo: data.registrationNumber,
            address: data.address ? data.address : undefined,
            contacts: data.contacts ? data.contacts : undefined,
            email: data.email,
            phone: data.phone,
            employees: data.employees,
          },
        });

        return createResponse(200, true, "Company created successfully", {
          company: newCompany,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
