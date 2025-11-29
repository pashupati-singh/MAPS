export const SaleTypeDefs = `#graphql
  type SaleItem {
    id: Int!
    saleId: Int!
    productId: Int!
    qty: Int!
    mrp: Float!
    lineAmount: Float!
  }

  type Sale {
    id: Int!
    mrId: Int!
    abmId: Int
    companyId: Int!
    doctorCompanyId: Int
    chemistCompanyId: Int
    workingAreaId: Int
    totalAmount: Float
    orderDate: String!
    createdAt: String!
    updatedAt: String!
    items: [SaleItem!]!
  }

  input SaleItemInput {
    productId: Int!
    qty: Int!
    mrp: Float!
    total: Float!   # client-side qty * mrp (server recomputes)
  }

  input CreateSaleInput {
    doctorCompanyId: Int
    chemistCompanyId: Int
    # workingAreaId is NOT passed from client; it is derived on server
    orderDate: String!        # "dd/mm/yyyy" or "yyyy-mm-dd"
    items: [SaleItemInput!]!
  }

  type SaleResponse {
    code: Int!
    success: Boolean!
    message: String
    data: Sale
  }

  type SaleReport {
    totalAmount: Float!
    totalQty: Int!
    sales: [Sale!]!
  }

  type DoctorContribution {
    doctorCompanyId: Int!
    doctorName: String!
    totalAmount: Float!
    percentage: Float!
  }

  type ChemistContribution {
    chemistCompanyId: Int!
    chemistName: String!
    totalAmount: Float!
    percentage: Float!
  }

  type AreaContribution {
    workingAreaId: Int!
    workingAreaName: String!
    totalAmount: Float!
    percentage: Float!
  }

  type ProductContribution {
    productId: Int!
    productName: String!
    totalAmount: Float!
    percentage: Float!
  }

  type UserSalesAnalytics {
    totalAmount: Float!
    doctorContributions: [DoctorContribution!]!
    chemistContributions: [ChemistContribution!]!
    areaContributions: [AreaContribution!]!
    productContributions: [ProductContribution!]!
  }

  type DoctorSearchResult {
    doctorCompanyId: Int!
    doctorId: Int!
    name: String!
    email: String
    phone: String
  }

  type ChemistSearchResult {
    chemistCompanyId: Int!
    chemistId: Int!
    name: String!
    email: String
    phone: String
  }

  type SearchDoctorChemistResponse {
    doctors: [DoctorSearchResult!]!
    chemists: [ChemistSearchResult!]!
  }

  type Query {
    # Company-wide sales in date range (for logged-in user's company)
    getSalesReport(startDate: String!, endDate: String!): SaleReport!

    # MR-wise analytics for logged-in user
    getMySalesAnalytics(startDate: String!, endDate: String!): UserSalesAnalytics!

    getSaleById(id: Int!): SaleResponse!
    searchDoctorChemist(text: String!): SearchDoctorChemistResponse!
  }

  type Mutation {
    # MR from context, ABM from user's abmId, company from context
    createSale(data: CreateSaleInput!): SaleResponse!
  }
`;
