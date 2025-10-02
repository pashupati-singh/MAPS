
export const ChemistTypeDefs = `#graphql
  enum ChemistStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
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
    status: ChemistStatus
    address: AddressInput
    email: String
    phone: String
    dob: String
    anniversary: String
    approxTarget: Int
  }

  input UpdateChemistInput {
    chemistId: Int!
    addressId: Int
    address: AddressInput
    name: String 
    titles: [String]
    status: ChemistStatus
    email: String
    phone: String
    dob: String
    anniversary: String
    approxTarget: Int
  }

  input UpdateChemistCompanyInput {
    chemistId: Int!
    companyId: Int!
    email: String
    phone: String
    dob: String
    anniversary: String
    approxTarget: Int
  }

  type ChemistResponse {
    code: Int!
    success: Boolean!
    message: String!
    data: Chemist
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
    email: String
    phone: String
    dob: String
    anniversary: String
    approxTarget: Int
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

  type ChemistResponseGet {
    code: Int!
    success: Boolean!
    message: String!
    chemists: [ChemistCompany!]
    lastPage: Int
  }

 type ChemistCompany {
  id: Int!
  chemist: Chemist!
  company: Company!
  doctor: Doctor
  email: String
  phone: String
  dob: String
  anniversary: String
  approxTarget: Int
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
    updateChemistCompany(input: UpdateChemistCompanyInput!): AssignChemistToCompanyResponse
    deleteChemist(id: ID!): ChemistResponse!
    assignChemistToCompany(input: AssignChemistToCompanyInput!): AssignChemistToCompanyResponse
    unassignChemistFromCompany(input: UnassignChemistFromCompanyInput!): UnassignChemistFromCompanyResponse
    assignDoctorToChemist(input: AssignDoctorToChemistInput!): AssignDoctorToChemistResponse
    unassignDoctorFromChemist(input: UnassignDoctorFromChemistInput!): UnassignDoctorFromChemistResponse
  }
`;
