import { gql } from "graphql-tag";

export const StockTypeDefs = gql`
  type Stock {
    id: Int!
    mrId: Int!
    doctorId: Int
    chemistId: Int
    productId: Int!
    qty: Int!
    dateOfUpdate: String!
    dateOfReminder: String
    createdAt: String!
    updatedAt: String!
  }

  input CreateStockInput {
    mrId: Int!
    doctorId: Int
    chemistId: Int
    productId: Int!
    qty: Int!
    dateOfUpdate: String
    dateOfReminder: String
  }

  type StockResponse {
    code: Int!
    success: Boolean!
    message: String
    data: Stock
  }

  type StockListResponse {
    code: Int!
    success: Boolean!
    message: String
    data: [Stock!]
  }

  input UpdateStockInput {
  id: Int!
  mrId: Int!
  qty: Int
  dateOfUpdate: String
  dateOfReminder: String
}

  type Query {
    getStockById(id: Int!): StockResponse!
    getStocksByMr(mrId: Int!): StockListResponse!
    getStocksByDoctor(doctorId: Int!): StockListResponse!
    getStocksByChemist(chemistId: Int!): StockListResponse!
    getStocksByProduct(productId: Int!): StockListResponse!
  }

  type Mutation {
    createStock(data: CreateStockInput!): StockResponse!
    updateStock(data: UpdateStockInput!): StockResponse!
  }
`;
