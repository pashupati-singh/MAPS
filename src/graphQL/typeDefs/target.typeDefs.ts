

export const TargetTypeDefs = `#graphql
  type Target {
    id: Int!
    companyId: Int!
    userId: Int!
    doctorId: Int
    chemistId: Int
    year: Int!
    month: Int
    quarter: Int
    halfYear: Int
    createdAt: String!
    updatedAt: String!
  }

  input CreateTargetInput {
    doctorId: Int
    chemistId: Int
    year: Int!
    month: Int
    quarter: Int
    halfYear: Int
  }

  input UpdateTargetInput {
    id: Int!
    doctorId: Int
    chemistId: Int
    year: Int
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

  type TargetListResponse {
    code: Int!
    success: Boolean!
    message: String
    data: [Target!]
  }

  extend type Query {
    getMrTargets: TargetListResponse!
    getAbmTargets(abmId: Int!): TargetListResponse!
    getCompanyTargets: TargetListResponse!
  }

  extend type Mutation {
    createTarget(data: CreateTargetInput!): TargetResponse!
    updateTarget(data: UpdateTargetInput!): TargetResponse!
  }
`;
