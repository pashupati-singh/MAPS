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

  extend type Query {
    chemists: ChemistsResponse!
    chemist(id: ID!): ChemistResponse!
  }

  extend type Mutation {
    createChemist(input: CreateChemistInput!): ChemistResponse!
    updateChemist(input: UpdateChemistInput!): ChemistResponse!
    deleteChemist(id: ID!): ChemistResponse!
  }
`;
