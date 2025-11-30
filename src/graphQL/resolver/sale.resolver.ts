import { PrismaClient } from "@prisma/client";
import { Context } from "../../context";
import { toUtcMidnight } from "../../utils/ConvertUTCToIST";

const prisma = new PrismaClient();

export const SaleResolvers = {
  Query: {
    getSalesReport: async (
      _: any,
      args: { startDate: string; endDate: string },
      context: Context
    ) => {
      if (!context || context.authError) {
        throw new Error(context?.authError || "Authorization Error");
      }
      if (!context.user?.userId) {
        throw new Error("User authorization required");
      }
      if (!context.user?.companyId) {
        throw new Error("Company authorization required");
      }

      const companyId = context.user.companyId;
      const { startDate, endDate } = args;

      const start = toUtcMidnight(startDate);
      const end = toUtcMidnight(endDate);
      const endExclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000); // +1 day

      const sales = await prisma.sale.findMany({
        where: {
          companyId,
          orderDate: {
            gte: start,
            lt: endExclusive,
          },
        },
        include: {
          SaleItem: true,
        },
      });

      const totalAmount = sales.reduce((sum, sale) => {
        if (sale.totalAmount != null) return sum + sale.totalAmount;
        const fromItems = sale.SaleItem.reduce(
          (s, item) => s + item.lineAmount,
          0
        );
        return sum + fromItems;
      }, 0);

      const totalQty = sales.reduce((sum, sale) => {
        const saleQty = sale.SaleItem.reduce(
          (s, item) => s + item.qty,
          0
        );
        return sum + saleQty;
      }, 0);

      return {
        totalAmount,
        totalQty,
        sales,
      };
    },

    // GET SINGLE SALE BY ID
    getSaleById: async (
      _: any,
      args: { id: number },
      context: Context
    ) => {
      if (!context || context.authError) {
        return {
          code: 400,
          success: false,
          message: context?.authError || "Authorization Error",
          data: null,
        };
      }

      const sale = await prisma.sale.findUnique({
        where: { id: args.id },
        include: {
          SaleItem: {
            include: { Product: true },
          },
          DoctorCompany: {
            include: { doctor: true },
          },
          ChemistCompany: {
            include: { chemist: true },
          },
          WorkingArea: true,
        },
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
    getMySalesAnalytics: async (
      _: any,
      args: { startDate: string; endDate: string },
      context: Context
    ) => {
      if (!context || context.authError) {
        throw new Error(context?.authError || "Authorization Error");
      }
      if (!context.user?.userId) {
        throw new Error("User authorization required");
      }
      if (!context.user?.companyId) {
        throw new Error("Company authorization required");
      }

      const userId = context.user.userId;      // MR id
      const companyId = context.user.companyId;
      const { startDate, endDate } = args;

      const start = toUtcMidnight(startDate);
      const end = toUtcMidnight(endDate);
      const endExclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000);

      const sales = await prisma.sale.findMany({
        where: {
          companyId,
          mrId: userId,
          orderDate: {
            gte: start,
            lt: endExclusive,
          },
        },
        include: {
          SaleItem: {
            include: {
              Product: true,
            },
          },
          DoctorCompany: {
            include: { doctor: true },
          },
          ChemistCompany: {
            include: { chemist: true },
          },
          WorkingArea: true,
        },
      });

      const totalAmount = sales.reduce((sum, sale) => {
        if (sale.totalAmount != null) return sum + sale.totalAmount;
        const fromItems = sale.SaleItem.reduce(
          (s, item) => s + item.lineAmount,
          0
        );
        return sum + fromItems;
      }, 0);

      const safeTotal = totalAmount || 0;

      // Maps for aggregation
      const doctorMap = new Map<number, { id: number; name: string; total: number }>();
      const chemistMap = new Map<number, { id: number; name: string; total: number }>();
      const areaMap = new Map<number, { id: number; name: string; total: number }>();
      const productMap = new Map<number, { id: number; name: string; total: number }>();

      for (const sale of sales) {
        const saleTotal = sale.SaleItem.reduce(
          (s, item) => s + item.lineAmount,
          0
        );

        // DoctorCompany
        if (sale.doctorCompanyId && sale.DoctorCompany && sale.DoctorCompany.doctor) {
          const id = sale.doctorCompanyId;
          const name = sale.DoctorCompany.doctor.name;
          const existing = doctorMap.get(id) || { id, name, total: 0 };
          existing.total += saleTotal;
          doctorMap.set(id, existing);
        }

        // ChemistCompany
        if (sale.chemistCompanyId && sale.ChemistCompany && sale.ChemistCompany.chemist) {
          const id = sale.chemistCompanyId;
          const name = sale.ChemistCompany.chemist.name;
          const existing = chemistMap.get(id) || { id, name, total: 0 };
          existing.total += saleTotal;
          chemistMap.set(id, existing);
        }

        // Area
        if (sale.workingAreaId && sale.WorkingArea) {
          const id = sale.workingAreaId;
          const name = sale.WorkingArea.workingArea;
          const existing = areaMap.get(id) || { id, name, total: 0 };
          existing.total += saleTotal;
          areaMap.set(id, existing);
        }

        // Products
        for (const item of sale.SaleItem) {
          if (!item.productId || !item.Product) continue;
          const id = item.productId;
          const name = item.Product.name;
          const existing = productMap.get(id) || { id, name, total: 0 };
          existing.total += item.lineAmount;
          productMap.set(id, existing);
        }
      }

      const doctorContributions = Array.from(doctorMap.values())
        .map((d) => ({
          doctorCompanyId: d.id,
          doctorName: d.name,
          totalAmount: d.total,
          percentage: safeTotal ? (d.total / safeTotal) * 100 : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

      const chemistContributions = Array.from(chemistMap.values())
        .map((c) => ({
          chemistCompanyId: c.id,
          chemistName: c.name,
          totalAmount: c.total,
          percentage: safeTotal ? (c.total / safeTotal) * 100 : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

      const areaContributions = Array.from(areaMap.values())
        .map((a) => ({
          workingAreaId: a.id,
          workingAreaName: a.name,
          totalAmount: a.total,
          percentage: safeTotal ? (a.total / safeTotal) * 100 : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

      const productContributions = Array.from(productMap.values())
        .map((p) => ({
          productId: p.id,
          productName: p.name,
          totalAmount: p.total,
          percentage: safeTotal ? (p.total / safeTotal) * 100 : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);

      return {
        totalAmount: safeTotal,
        doctorContributions,
        chemistContributions,
        areaContributions,
        productContributions,
      };
    },


     searchDoctorChemist: async (
      _: any,
      args: { text: string },
      context: Context
    ) => {
      if (!context || context.authError) {
        throw new Error(context?.authError || "Authorization Error");
      }
      if (!context.user?.userId) {
        throw new Error("User authorization required");
      }
      if (!context.user?.companyId) {
        throw new Error("Company authorization required");
      }
       
      const userId = context.user.userId;


      const companyId = context.user.companyId;
      const { text } = args;

      const doctorCompanies = await prisma.doctorCompany.findMany({
        where: {
          companyId,
          UserDoctor: {
                some: {
                  userId,          
                },
              },
          doctor: {
            name: {
              contains: text,
              mode: "insensitive", 
            },
          },
        },
        include: {
          doctor: true,
        },
        take: 50,
      });

      const doctors = doctorCompanies.map((dc) => ({
        doctorCompanyId: dc.id,
        doctorId: dc.doctorId,
        name: dc.doctor.name,
        email: dc.email || null,
        phone: dc.phone || null,
      }));

      const chemistCompanies = await prisma.chemistCompany.findMany({
        where: {
          companyId,
           UserChemist: {
            some: {
                 userId,          
            },
          },
          chemist: {
            name: {
              contains: text,
              mode: "insensitive",
            },
          },
        },
        include: {
          chemist: true,
        },
        take: 50, 
      });

      const chemists = chemistCompanies.map((cc) => ({
        chemistCompanyId: cc.id,
        chemistId: cc.chemistId,
        name: cc.chemist.name, 
        email: cc.email || null,
        phone: cc.phone || null,
      }));

      return {
        doctors,
        chemists,
      };
    },
  },

  Mutation: {
    createSale: async (
  _: any,
  args: { data: any },
  context: Context
) => {
  if (!context || context.authError) {
    return {
      code: 400,
      success: false,
      message: context?.authError || "Authorization Error",
      data: null,
    };
  }
  if (!context.user?.userId) {
    return {
      code: 400,
      success: false,
      message: "User authorization required",
      data: null,
    };
  }
  if (!context.user?.companyId) {
    return {
      code: 400,
      success: false,
      message: "Company authorization required",
      data: null,
    };
  }

  const mrId = context.user.userId;
  const companyId = context.user.companyId;
  const { data } = args;

  // get ABM for this MR from User.abmId
  const mrUser = await prisma.user.findUnique({
    where: { id: mrId },
    select: { abmId: true },
  });
  const abmId = mrUser?.abmId ?? null;

  const orderDate = toUtcMidnight(data.orderDate);

  // only one of doctorCompanyId / chemistCompanyId
  if (data.doctorCompanyId && data.chemistCompanyId) {
    return {
      code: 400,
      success: false,
      message: "Provide either doctorCompanyId or chemistCompanyId, not both",
      data: null,
    };
  }

  // 🔍 derive workingAreaId from mapping tables
  let workingAreaId: number | null = null;

  if (data.chemistCompanyId) {
    const chemistArea = await prisma.chemistCompanyWorkingArea.findFirst({
      where: {
        chemistCompanyId: data.chemistCompanyId,
      },
      select: {
        workingAreaId: true,
      },
    });
    workingAreaId = chemistArea?.workingAreaId ?? null;
  } else if (data.doctorCompanyId) {
    const doctorArea = await prisma.doctorCompanyWorkingArea.findFirst({
      where: {
        doctorCompanyId: data.doctorCompanyId,
      },
      select: {
        workingAreaId: true,
      },
    });
    workingAreaId = doctorArea?.workingAreaId ?? null;
  }

  const itemsInput = data.items || [];
  if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
    return {
      code: 400,
      success: false,
      message: "At least one product item is required",
      data: null,
    };
  }

  const itemsData = itemsInput.map((item: any) => {
    const qty = Number(item.qty);
    const mrp = Number(item.mrp);
    const computedTotal = qty * mrp;

    return {
      productId: item.productId,
      qty,
      mrp,
      lineAmount: computedTotal,
    };
  });

  const totalAmount = itemsData.reduce(
    (sum: number, item: any) => sum + item.lineAmount,
    0
  );

  const sale = await prisma.sale.create({
    data: {
      mrId,
      abmId,
      companyId,
      doctorCompanyId: data.doctorCompanyId ?? null,
      chemistCompanyId: data.chemistCompanyId ?? null,
      workingAreaId, // 👈 derived, not from API
      orderDate,
      totalAmount,
      SaleItem: {
        create: itemsData,
      },
    },
    include: {
      SaleItem: true,
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
