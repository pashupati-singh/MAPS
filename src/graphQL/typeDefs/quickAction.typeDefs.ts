export const QuickActionTypeDefs = `#graphql
  scalar JSON

  type QuickAction {
    id: Int!
    userId: Int!
    companyId: Int!
    quickAction: JSON!
    createdAt: String!
    updatedAt: String!
  }

  type QuickActionResponse {
    code: Int!
    success: Boolean!
    message: String
    data: QuickAction
  }

  input CreateQuickActionInput {
    quickAction: JSON!
  }

  extend type Mutation {
    createQuickAction(data: CreateQuickActionInput!): QuickActionResponse!
  }
`;
