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
    street: String
    area: String
    city: String
    state: String
    postalCode: String
    country: String
    landmark: String
  }

  input AddressInput {
    street: String
    area: String
    city: String
    state: String
    postalCode: String
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


  type Mutation {
    addCompany(data: CompanyInput!): CompanyResponse!
  }

`;
