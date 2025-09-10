import { gql } from "graphql-tag";

export const DoctorTypeDefs = gql`
  type Doctor {
    id: Int
    name: String!
    titles: [String]        
    email: String
    phone: String
    status: DoctorStatus
    address: Address
    companies: [Company!]
    chemists: [Chemist!]
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

  input addressInput {
    address: String
    city: String
    state: String
    pinCode: String
    country: String
    landmark: String
  }

  input CreateDoctorInput {
    name: String!
    titles: [String]
    email: String
    phone: String
    status: DoctorStatus
    address: addressInput
  }

  input UpdateDoctorInput {
    id: ID!
    name: String
    titles: [String]
    email: String
    phone: String
    status: DoctorStatus
    address: addressInput
  }

  type DoctorResponse {
    code: Int!
    success: Boolean!
    message: String!
    doctor: Doctor
  }

  type Query {
    doctors: [Doctor!]
    doctor(id: ID!): Doctor
  }

  type Mutation {
    createDoctor(input: CreateDoctorInput!): DoctorResponse
    updateDoctor(input: UpdateDoctorInput!): DoctorResponse
    deleteDoctor(id: ID!): DoctorResponse
  }
`;
