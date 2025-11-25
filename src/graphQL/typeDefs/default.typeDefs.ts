export const DefaultTypeDefs = `#graphql
  type Default {
    id: Int!
    ta: Float
    da: Float
    ha: Float
    ca: Float
    oa: Float
    userId: Int
    companyId: Int
    createdAt: String
    updatedAt: String
  }

  input CreateDefaultInput {
    userId: Int
    ta: Float
    da: Float
    ha: Float
    ca: Float
    oa: Float
  }

  input UpdateDefaultInput {
    id: Int!
    userId: Int
    ta: Float
    da: Float
    ha: Float
    ca: Float
    oa: Float
  }

  type DefaultResponse {
    code: Int!
    success: Boolean!
    message: String
    data: Default
  }

  type DefaultsResponse {
    code: Int!
    success: Boolean!
    message: String
    data: [Default]
    lastPage: Int
  }

  extend type Query {
    getDefaults(page: Int, limit: Int): DefaultsResponse!
    getDefaultById(id: Int!): DefaultResponse!
    getDefaultByUserId: DefaultResponse!
  }

  extend type Mutation {
    createDefault(data: CreateDefaultInput!): DefaultResponse!
    updateDefault(data: UpdateDefaultInput!): DefaultResponse!
    deleteDefault(id: Int!): DefaultResponse!
  }
`;
