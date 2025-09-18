import { gql } from "graphql-tag";

export const DoctorTypeDefs = gql`
  enum DoctorStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
  }

  type Doctor {
    id: Int!
    name: String!
    titles: [String]
    status: DoctorStatus
    address: Address
    companies: [DoctorCompany!]!   # company-specific details
    chemists: [Chemist!]           # linked chemists
    products: [Product!]
    createdAt: String
    updatedAt: String
  }

  type DoctorCompany {
    id: Int!
    doctor: Doctor!
    company: Company!
    email: String
    phone: String
    dob: String
    anniversary: String
    approxTarget: Int
  }

  type DoctorChemist {
    id: Int!
    doctor: Doctor!
    chemist: Chemist!
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

  # ------------------ Inputs ------------------

  input CreateDoctorInput {
    name: String!
    titles: [String]
    status: DoctorStatus
    address: AddressInput
    companyId: Int!
    email: String
    phone: String
    dob: String
    anniversary: String
    approxTarget: Int
  }

  input UpdateDoctorInput {
    name: String
    titles: [String]
    status: DoctorStatus
    address: AddressInput
  }

  input UpdateDoctorCompanyInput {
    doctorId: Int!
    companyId: Int!
    email: String
    phone: String
    dob: String
    anniversary: String
    approxTarget: Int
  }

  # Assign/Unassign Chemists (bulk)
  input AssignDoctorToChemistsInput {
    doctorId: Int!
    chemistIds: [Int!]!
  }

  input UnassignDoctorFromChemistsInput {
    doctorId: Int!
    chemistIds: [Int!]!
  }

  # Assign/Unassign Company
  input AssignDoctorToCompanyInput {
    doctorId: Int!
    companyId: Int!
    email: String
    phone: String
    dob: String
    anniversary: String
    approxTarget: Int
  }

  input UnassignDoctorFromCompanyInput {
    doctorId: Int!
    companyId: Int!
  }

  # ------------------ Responses ------------------

  type DoctorResponse {
    code: Int!
    success: Boolean!
    message: String!
    doctor: Doctor
  }

  type DoctorsResponse {
    code: Int!
    success: Boolean!
    message: String!
    doctors: [Doctor!]
  }

  type AssignDoctorToChemistsResponse {
    code: Int!
    success: Boolean!
    message: String!
    doctorChemists: [DoctorChemist!]
  }

  type UnassignDoctorFromChemistsResponse {
    code: Int!
    success: Boolean!
    message: String!
  }

  type AssignDoctorToCompanyResponse {
    code: Int!
    success: Boolean!
    message: String!
    doctorCompany: DoctorCompany
  }

  type UnassignDoctorFromCompanyResponse {
    code: Int!
    success: Boolean!
    message: String!
  }

  # ------------------ Queries & Mutations ------------------

  extend type Query {
    doctors: DoctorsResponse!
    doctor(id: ID!): DoctorResponse!
  }

  extend type Mutation {
    createDoctor(input: CreateDoctorInput!): DoctorResponse!
    updateDoctor(input: UpdateDoctorInput!): DoctorResponse!
    updateDoctorCompany(input: UpdateDoctorCompanyInput!): DoctorCompany
    deleteDoctor(id: ID!): DoctorResponse!

    assignDoctorToChemists(input: AssignDoctorToChemistsInput!): AssignDoctorToChemistsResponse!
    unassignDoctorFromChemists(input: UnassignDoctorFromChemistsInput!): UnassignDoctorFromChemistsResponse!

    assignDoctorToCompany(input: AssignDoctorToCompanyInput!): AssignDoctorToCompanyResponse!
    unassignDoctorFromCompany(input: UnassignDoctorFromCompanyInput!): UnassignDoctorFromCompanyResponse!
  }
`;
