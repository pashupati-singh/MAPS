

export const SaleTypeDefs =`#graphql
  type Sale {
    id: Int!
    mrId: Int!
    companyId: Int!
    doctorId: Int
    chemistId: Int
    productId: Int!
    qty: Int!
    price: Float!
    totalAmount: Float!
    orderDate: String!
    createdAt: String!
    updatedAt: String!
  }

  input CreateSaleInput {
    mrId: Int!
    companyId: Int!
    doctorId: Int
    chemistId: Int
    productId: Int!
    qty: Int!
    price: Float!
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

  type Query {
    # Get sales within a custom date range
    getSalesReport(companyId: Int!, startDate: String!, endDate: String!): SaleReport!
    getSaleById(id: Int!): SaleResponse!
  }

  type Mutation {
    createSale(data: CreateSaleInput!): SaleResponse!
  }
`;
