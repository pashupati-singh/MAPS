import { gql } from "graphql-tag";

export const TargetTypeDefs = gql`
  type Target {
    id: Int!
    companyId: Int!
    userId: Int
    year: Int!
    month: Int
    quarter: Int
    halfYear: Int
    createdAt: String!
    updatedAt: String!
  }

  type ProductTarget {
    id: Int!
    companyId: Int!
    userId: Int
    productId: Int!
    year: Int!
    month: Int
    quarter: Int
    halfYear: Int
    createdAt: String!
    updatedAt: String!
  }

  input CreateTargetInput {
    companyId: Int!
    userId: Int!       # MR ID
    year: Int!
    month: Int
    quarter: Int
    halfYear: Int
  }

  input CreateProductTargetInput {
    companyId: Int!
    userId: Int!       # MR ID
    productId: Int!
    year: Int!
    month: Int
    quarter: Int
    halfYear: Int
  }

  type TargetResponse {
    code: Int!
    success: Boolean!
    message: String
    data: Target
  }

  type ProductTargetResponse {
    code: Int!
    success: Boolean!
    message: String
    data: ProductTarget
  }

  type TargetListResponse {
    code: Int!
    success: Boolean!
    message: String
    data: [Target!]
  }

  type ProductTargetListResponse {
    code: Int!
    success: Boolean!
    message: String
    data: [ProductTarget!]
  }

  extend type Query {
    getMrTargets(userId: Int!): TargetListResponse!
    getAbmTargets(abmId: Int!): TargetListResponse!
    getCompanyTargets(companyId: Int!): TargetListResponse!

    getMrProductTargets(userId: Int!): ProductTargetListResponse!
    getAbmProductTargets(abmId: Int!, productId: Int!): ProductTargetListResponse!
    getCompanyProductTargets(companyId: Int!, productId: Int!): ProductTargetListResponse!
  }

  extend type Mutation {
    createTarget(data: CreateTargetInput!): TargetResponse!
    createProductTarget(data: CreateProductTargetInput!): ProductTargetResponse!
  }
`;
