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
  enum CompanySize {
    STARTUP
    SME
    ENTERPRISE
  }

  enum CompanyStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
  }

   type Address {
    address : String
    city: String
    state: String
    pinCode: String
    country: String
    landmark: String
  }

  type Contact {
    name: String
    email: String
    phone: String
  }
  
  type Company {
    id: Int
    name: String
    legalName: String
    size: CompanySize
    website: String
    logoUrl: String
    status: CompanyStatus
    gstNumber: String
    registrationNo: String
    address: Address
    contacts: [Contact]
    email: String
    phone: String
    employees: Int
    isEmailVerified: Boolean
    isPhoneVerified: Boolean
    createdAt: String
    updatedAt: String
  }

  type User {
    id: Int!
    companyId: Int!
    email: String!
    phone: String!
    role: UserRole!
    status: UserStatus!
    company : Company
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

  input AssignMrsToAbmInput {
  abmId: Int!
  mrIds: [Int!]!
}

  type Mutation {
    createUser(data: CreateUserInput!): UserResponse!
    setMpin(userId: Int!, mpin: String!): UserResponse!
    verifyMpin(userId: Int!, mpin: String!): UserResponse!
    resendOtp(userId: Int!, type: String!): UserResponse!
    verifyOtp(userId: Int!, type: String!, otp: String!): UserResponse!
    loginUser(email: String!, password: String!): AuthPayload!
    assignMrsToAbm(data: AssignMrsToAbmInput!): UserResponse!
  }
`;
