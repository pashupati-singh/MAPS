export const WorkingAreaTypeDefs = `#graphql
  type WorkingArea {
    id: Int!
    companyId: Int!
    state: String!
    city: String!
    district: String!
    workingArea: String!
  }

  type WorkingAreaRelations {
    workingArea: WorkingArea!
    doctorCompanies: [DoctorCompany!]!
    chemistCompanies: [ChemistCompany!]!
    users: [User!]!
  }
    

  input CreateWorkingAreaInput {
    state: String!
    city: String!
    district: String!
    workingArea: String!
  }

  input UpdateWorkingAreaInput {
    id: Int!
    state: String
    city: String
    district: String
    workingArea: String
  }

  input AssignEntitiesToWorkingAreaInput {
    workingAreaId: Int!
    doctorCompanyIds: [Int!]
    chemistCompanyIds: [Int!]
    userIds: [Int!]
  }

  input AssignWorkingAreasToEntitiesInput {
    workingAreaIds: [Int!]!
    userId: Int
    doctorCompanyId: Int
    chemistCompanyId: Int
  }

  type WorkingAreaResponse {
    code: Int!
    success: Boolean!
    message: String
    data: WorkingArea
  }

  type WorkingAreasResponse {
    code: Int!
    success: Boolean!
    message: String
    data: [WorkingArea]
  }

  type WorkingAreaRelationsResponsePagination {
     code: Int!
    success: Boolean!
    message: String
    data: [WorkingArea]
    lastPage: Int
  }

  type WorkingAreaRelationsResponse {
    code: Int!
    success: Boolean!
    message: String
    data: WorkingAreaRelations
  }

  type UsersByWorkingAreaResponse {
    code: Int!
    success: Boolean!
    message: String
    data: [User]
  }

type Data {
  user: [User!]
  doctorCompany: [DoctorCompany!]
  chemistCompany: [ChemistCompany!]
}

type WorkingAreaData {
  code: Int!
  success: Boolean!
  message: String
  data: Data
}

  type User {
    companyId: Int!
    email: String!
    phone: String!
    role: UserRole!
  }

  extend type Query {
    getWorkingAreasByCompanyId(companyId: Int , page: Int , limit: Int): WorkingAreaRelationsResponsePagination!
    getWorkingAreaRelations(workingAreaId: Int!): WorkingAreaRelationsResponse!
    getUsersByWorkingArea(workingAreaId: Int!): UsersByWorkingAreaResponse!
    getWorkingAreaData(companyId: Int!): WorkingAreaData!
  }

  extend type Mutation {
    createWorkingArea(data: CreateWorkingAreaInput!): WorkingAreaResponse!
    updateWorkingArea(data: UpdateWorkingAreaInput!): WorkingAreaResponse!
    deleteWorkingArea(id: Int!): WorkingAreaResponse!

    assignEntitiesToWorkingArea(
      data: AssignEntitiesToWorkingAreaInput!
    ): WorkingAreaResponse!

    assignWorkingAreasToEntities(
      data: AssignWorkingAreasToEntitiesInput!
    ): WorkingAreaResponse!
  }
`;
