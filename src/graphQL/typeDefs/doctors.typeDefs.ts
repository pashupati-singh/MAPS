

export const DoctorTypeDefs = `#graphql
 # ------------------ Enums ------------------
enum DoctorStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum ChemistStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

# ------------------ Types ------------------

scalar JSON

type Product {
  id: Int!
  name: String!
  type: String!
  salt: String
  details: JSON
  companyId: Int!
  createdAt: String!
  updatedAt: String!
}

type Chemist {
  id: Int!
  name: String!
  titles: [String]
  status: ChemistStatus
  address: Address
  companies: [ChemistCompany!]!
  doctors: [Doctor!]
  products: [Product!]
  createdAt: String
  updatedAt: String
}

type Doctor {
  id: Int!
  name: String!
  titles: [String]
  status: DoctorStatus
  address: Address
  companies: [DoctorCompany!]!
  chemists: [Chemist!]
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

type ChemistCompany {
  id: Int!
  chemist: Chemist!
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
  company: Company!
}

type Address {
  id: Int
  address: String
  city: String
  state: String
  pinCode: String
  country: String
  landmark: String
  latitude: Float
  longitude: Float
}

# ------------------ Inputs ------------------

input AddressInput {
  address: String
  city: String
  state: String
  pinCode: String
  country: String
  landmark: String
  latitude: Float
  longitude: Float
}

input CreateDoctorInput {
  name: String!
  titles: [String]
  status: DoctorStatus
  address: AddressInput
  email: String
  phone: String
  dob: String
  anniversary: String
  approxTarget: Int
}

input UpdateDoctorInput {
  doctorId: Int!
  addressId: Int
  name: String
  titles: [String]
  status: DoctorStatus
  address: AddressInput
  email: String
  phone: String
  dob: String
  anniversary: String
  approxTarget: Int
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

input AssignDoctorToChemistsInput {
  doctorId: Int!
  chemistIds: [Int!]!
}

input UnassignDoctorFromChemistsInput {
  doctorId: Int!
  chemistIds: [Int!]!
}

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

type DoctorResponseId {
  code: Int!
  success: Boolean!
  message: String!
  data: Doctor
}

type DoctorsResponse {
  code: Int!
  success: Boolean!
  message: String!
  doctors: [DoctorCompany!]
  lastPage: Int
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
  doctors(page: Int, limit: Int): DoctorsResponse!
  doctor(id: Int!): DoctorResponseId!
}

extend type Mutation {
  createDoctor(input: CreateDoctorInput!): DoctorResponse!
  updateDoctor(input: UpdateDoctorInput!): DoctorResponse!
  updateDoctorCompany(input: UpdateDoctorCompanyInput!): AssignDoctorToCompanyResponse!
  deleteDoctor(id: ID!): DoctorResponse!

  assignDoctorToChemists(input: AssignDoctorToChemistsInput!): AssignDoctorToChemistsResponse!
  unassignDoctorFromChemists(input: UnassignDoctorFromChemistsInput!): UnassignDoctorFromChemistsResponse!

  assignDoctorToCompany(input: AssignDoctorToCompanyInput!): AssignDoctorToCompanyResponse!
  unassignDoctorFromCompany(input: UnassignDoctorFromCompanyInput!): UnassignDoctorFromCompanyResponse!
}

`;
