
export const ChemistTypeDefs = `#graphql
  enum ChemistStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
  }

  scalar JSON

type Product {
  id: Int
  name: String!
  type: String!
  salt: String
  details: JSON
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

  type Chemist {
    id: Int
    name: String!
    titles: [String]
    status: ChemistStatus
    address: Address
    createdAt: String
    updatedAt: String
  }

type Doctor {
  id: Int
  name: String!
  titles: [String]
  status: DoctorStatus
  address: Address
  createdAt: String
  updatedAt: String
}

  type DoctorCompany {
    id: Int
    doctor: Doctor
    email: String
    phone: String
    dob: String
    anniversary: String
    approxTarget: Int
  }

type DoctorChemist {
  id: Int
  doctorCompany: DoctorCompany!
}

type ChemistProduct {
  id: Int!
  product: Product!
}

 type ChemistCompany {
  id: Int
  chemist: Chemist!
  doctorChemist: [DoctorChemist!]
  ChemistProduct: [ChemistProduct!]
  email: String
  phone: String
  dob: String
  anniversary: String
  approxTarget: Int
}

# ------------------------------------------------------------------------------------

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
    chemists: [ChemistCompany!]
    lastPage: Int
  }

  type ChemistResponseGet {
    code: Int!
    success: Boolean!
    message: String!
     data: ChemistCompany
  }

# -------------------------------------------------------------------------------

  input UpdateChemistCompanyInput {
    chemistCompanyId: Int!
    email: String
    phone: String
    dob: String
    anniversary: String
    approxTarget: Int
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


  # --------------------------------------------------------------------------------

  input AssignChemistToCompanyInput {
    chemistId: Int!
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
  chemistIds: [Int!]!
}

  type UnassignChemistFromCompanyResponse {
    code: Int!
    success: Boolean!
    message: String!
  }



# ---------------------------------------------------------------------------------------------------------------------

input AssignDoctorToChemistInput {
  doctorCompanyId: Int!
  chemistCompanyIds: [Int!]!
}

type AssignDoctorToChemistResponse {
  code: Int!
  success: Boolean!
  message: String!
  created: [DoctorChemist]
}

input UnassignDoctorFromChemistInput {
  doctorChemistIds: [Int!]!
}

type UnassignDoctorFromChemistResponse {
  code: Int!
  success: Boolean!
  message: String!
}

# -----------------------------------------------------------------------------

  extend type Query {
    chemists(page : Int, limit : Int): ChemistsResponse!
    chemist(id: Int!): ChemistResponseGet!
  }

  extend type Mutation {
    createChemist(input: CreateChemistInput!): ChemistResponse!
    updateChemist(input: UpdateChemistInput!): ChemistResponse!
    assignChemistToCompany(input: AssignChemistToCompanyInput!): AssignChemistToCompanyResponse
    unassignChemistFromCompany(input: UnassignChemistFromCompanyInput!): UnassignChemistFromCompanyResponse
    assignDoctorToChemist(input: AssignDoctorToChemistInput!): AssignDoctorToChemistResponse
    unassignDoctorFromChemist(input: UnassignDoctorFromChemistInput!): UnassignDoctorFromChemistResponse
    updateChemistCompanyWithCheComId(input: UpdateChemistCompanyInput!): AssignChemistToCompanyResponse
    deleteChemist(id: ID!): ChemistResponse!
  }
`;
