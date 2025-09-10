import { gql } from "graphql-tag";

export const UserTypeDefs = gql`
  enum UserRole {
    MR
    ABM
    ZM
    ADMIN
  }

  enum UserStatus {
    ACTIVE
    BLOCKED
    SUSPENDED
  }

  type User {
    id: Int!
    companyId: Int!
    email: String!
    phone: String!
    role: UserRole!
    status: UserStatus!
    createdAt: String!
    updatedAt: String!
  }

  input CreateUserInput {
    companyId: Int!
    email: String!
    phone: String!
    password: String!
    role: UserRole!
  }

  type UserResponse {
    code: Int!
    success: Boolean!
    message: String
    data: User
  }

  type AuthPayload {
  code: Int!
  success: Boolean!
  message: String!
  token: String
  user: User
  company: Company
}

  type Query {
    getUser(companyId: Int!): UserResponse!
    userId (id: Int!): UserResponse!
  }

  type Mutation {
    createUser(data: CreateUserInput!): UserResponse!
    setMpin(userId: Int!, mpin: String!): UserResponse!
    verifyMpin(userId: Int!, mpin: String!): UserResponse!
    resendOtp(userId: Int!, type: String!): UserResponse!
    verifyOtp(userId: Int!, type: String!, otp: String!): UserResponse!
    loginUser(email: String!, password: String!): AuthPayload!
  }
`;
