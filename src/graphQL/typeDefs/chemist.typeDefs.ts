import { gql } from "graphql-tag";

export const ChemistTypeDefs = gql`
  enum ChemistStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
  }

  type Chemist {
    id: Int
    name: String!
    titles: [String]
    email: String
    phone: String
    status: ChemistStatus
    address: Address
    companies: [Company!]
    doctors: [Doctor!]
    products: [Product!]
    createdAt: String
    updatedAt: String
  }

  type Address {
    id: Int
    address: String
    city: String
    state: String
    pinCode: String
    country: String
    landmark: String
    latitude: String
    longitude: String
  }

  input AddressInput {
    address: String
    city: String
    state: String
    pinCode: String
    country: String
    landmark: String
  }

  input CreateChemistInput {
    name: String!
    titles: [String]
    email: String
    phone: String
    companyId: Int
    doctorId: Int
    status: ChemistStatus
    address: AddressInput
  }

  input UpdateChemistInput {
    name: String
    titles: [String]
    email: String
    phone: String
    status: ChemistStatus
    address: AddressInput
  }

  type ChemistResponse {
    code: Int!
    success: Boolean!
    message: String!
    chemist: Chemist
  }

  type ChemistsResponse {
    code: Int!
    success: Boolean!
    message: String!
    chemists: [Chemist!]
  }

  input AssignChemistToCompanyInput {
  chemistId: Int!
  companyId: Int!
}

type AssignChemistToCompanyResponse {
  code: Int!
  success: Boolean!
  message: String!
  chemistCompany: ChemistCompany
}

input UnassignChemistFromCompanyInput {
  chemistId: Int!
  companyId: Int!
}

type UnassignChemistFromCompanyResponse {
  code: Int!
  success: Boolean!
  message: String!
}

input AssignDoctorToChemistInput {
  doctorId: Int!
  chemistId: Int!
}

type AssignDoctorToChemistResponse {
  code: Int!
  success: Boolean!
  message: String!
  doctorChemist: DoctorChemist
}

input UnassignDoctorFromChemistInput {
  doctorId: Int!
  chemistId: Int!
}

type UnassignDoctorFromChemistResponse {
  code: Int!
  success: Boolean!
  message: String!
}

  extend type Query {
    chemists: ChemistsResponse!
    chemist(id: ID!): ChemistResponse!
  }

  extend type Mutation {
    createChemist(input: CreateChemistInput!): ChemistResponse!
    updateChemist(input: UpdateChemistInput!): ChemistResponse!
    deleteChemist(id: ID!): ChemistResponse!
    assignChemistToCompany(input: AssignChemistToCompanyInput!): AssignChemistToCompanyResponse
    unassignChemistFromCompany(input: UnassignChemistFromCompanyInput!): UnassignChemistFromCompanyResponse
    assignDoctorToChemist(input: AssignDoctorToChemistInput!): AssignDoctorToChemistResponse
    unassignDoctorFromChemist(input: UnassignDoctorFromChemistInput!): UnassignDoctorFromChemistResponse
  }
`;
