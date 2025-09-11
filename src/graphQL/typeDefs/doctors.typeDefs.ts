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

  
  input UpdateDoctorInput {
    id: ID!
    name: String
    titles: [String]
    email: String
    phone: String
    status: DoctorStatus
    address: addressInput
  }

  input CreateDoctorInput {
    name: String!
    titles: [String]
    email: String
    phone: String
    companyId: Int!
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

input AssignDoctorToCompanyInput {
  doctorId: Int!
  companyId: Int!
}

type DoctorCompanyResponse {
  code: Int!
  success: Boolean!
  message: String!
  doctorCompany: DoctorCompany
}

input UnassignDoctorFromCompanyInput {
  doctorId: Int!
  companyId: Int!
}

type UnassignDoctorFromCompanyResponse {
  code: Int!
  success: Boolean!
  message: String!
}


  type Mutation {
    createDoctor(input: CreateDoctorInput!): DoctorResponse
    updateDoctor(input: UpdateDoctorInput!): DoctorResponse
    assignDoctorToCompany(input: AssignDoctorToCompanyInput!): DoctorCompanyResponse
    unassignDoctorFromCompany(input: UnassignDoctorFromCompanyInput!): UnassignDoctorFromCompanyResponse
    deleteDoctor(id: ID!): DoctorResponse
  }
`;
