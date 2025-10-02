
export const UserTypeDefs = `#graphql
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
    name : String
    division: String
    joiningDate: String
    status: UserStatus!
    company : Company
    createdAt: String!
    updatedAt: String!
  }

  input CreateUserInput {
    email: String!
    phone: String!
    password: String!
    joiningDate: String
    role: UserRole!
  }

  type UserResponse {
    code: Int!
    success: Boolean!
    message: String
    data: User
  }

   type UserResponses {
    code: Int!
    success: Boolean!
    message: String
    data: [User]
  }

  type AuthPayload {
  code: Int!
  success: Boolean!
  message: String!
  token: String
  user: User
  company: Company
}

  input AssignMrsToAbmInput {
  abmId: Int!
  mrIds: [Int!]!
}

input UpdateUserInput {
  id: Int
  name: String
  phone: String
  division: String
  status: UserStatus
  role: UserRole
  joiningDate: String
}


  type Query {
    getUsers: UserResponses!
    userId (id: Int!): UserResponse!
  }

  type Mutation {
    createUser(data: CreateUserInput!): UserResponse!
    updateUser(data: UpdateUserInput!): UserResponse!
    setMpin( mpin: String!): UserResponse!
    verifyMpin(userId: Int!, mpin: String!): AuthPayload!
    resendOtp(email: String, phone: String, type: String!): UserResponse!
    verifyOtp(type : String!, email : String, phone : String, otpOrToken : String!): UserResponse!
    loginUser(email: String!, password: String!): AuthPayload!
    assignMrsToAbm(data: AssignMrsToAbmInput!): UserResponse!
  }
`;
