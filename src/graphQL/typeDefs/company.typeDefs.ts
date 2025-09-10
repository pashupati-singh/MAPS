import { gql } from 'graphql-tag';

export const CompanyTypeDefs = gql`

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

  input AddressInput {
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

  input ContactInput {
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
    registrationNumber: String
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

  input CompanyInput {
    name: String!
    legalName: String
    size: CompanySize
    website: String
    logoUrl: String
    status: CompanyStatus
    gstNumber: String
    registrationNumber: String
    address: AddressInput
    contacts: [ContactInput]
    email: String!
    phone: String!
    employees: Int
  }

  type Query {
    companies: [Company!]!
    company(id: Int!): Company
  }

  type CompanyResponse {
    code: Int!
    success: Boolean!
    message: String
    data: Company
  }

  enum VerificationType {
  EMAIL
  PHONE
}

type Mutation {
  addCompany(data: CompanyInput!): CompanyResponse!
  resendVerification(type: VerificationType!, value: String!): CompanyResponse!
  verify(type: VerificationType!, value: String!, otpOrToken: String!): CompanyResponse!
}

`;
