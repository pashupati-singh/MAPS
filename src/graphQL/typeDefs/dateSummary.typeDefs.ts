export const DateSummaryTypeDefs = `#graphql
  type Request {
    id: Int!
    userId: Int
    companyId: Int
    requestType: String
    name: String
    startDate: String
    endDate: String
    productName: String
    abmId: Int
    isApproved: Boolean
    isReject: Boolean
    assoicateDoc: String
    remark: String
    associates: [String!]
    requestedDate: String!
  }

  type ExpenseDetails {
    id: Int!
    expenseId: Int
    ta: Float
    da: Float
    ha: Float
    ca: Float
    oa: Float
    date: String
    miscellaneous: Float
    reason: String
    total: Float
  }

  type DoctorCompany {
    email: String
    phone: String
    doctor: Doctor
  }

  type ChemistCompany {
    email: String
    phone: String
    dob: String
    chemist: Chemist
  }

  type Product {
    id: Int!
    name: String!
    type: String!
    salt: String
    details: JSON
    companyId: Int!
    createdAt: String!
    updatedAt: String!
  }

  # 🔁 UPDATED: matches Prisma SaleItem (with Product)
  type SaleItem {
    id: Int!
    saleId: Int!
    productId: Int!
    qty: Int!
    mrp: Float!
    lineAmount: Float
    product: Product!        # populated via include: { Product: true }
  }

  # 🔁 UPDATED: matches Prisma Sale + your includes
  type Sale {
    id: Int!
    mrId: Int!
    companyId: Int!
    totalAmount: Float
    orderDate: String!
    saleItems: [SaleItem!]!      # populated from SaleItem[]
    doctorCompany: DoctorCompany # populated from DoctorCompany
    chemistCompany: ChemistCompany # populated from ChemistCompany
    workingArea: WorkingArea     # populated from WorkingArea
  }

  type DateSummaryData {
    date: String!
    dailyPlans: [DailyPlan!]!
    remindars: [Remindar!]!
    requests: [Request!]!
    expenseDetails: [ExpenseDetails!]!
    sales: [Sale!]!
  }

  type DateSummaryResponse {
    code: Int!
    success: Boolean!
    message: String
    data: DateSummaryData
  }

  extend type Query {
    dateSummary(date: String!): DateSummaryResponse!
  }
`;
