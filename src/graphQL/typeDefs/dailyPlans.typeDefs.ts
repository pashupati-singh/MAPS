export const DailyPlanTypeDefs = `#graphql
 type DailyPlan {
  id: Int!
  mrId: Int!
  abmId: Int
  companyId: Int!
  isApproved: Boolean!
  workTogether: Boolean!
  isRejected: Boolean!
  isWorkTogetherConfirmed: Boolean!
  planDate: String!
  notes: String
  createdAt: String!
  mr: User
  updatedAt: String!
  doctors: [DailyPlanDoctor!]!
  chemists: [DailyPlanChemist!]!
}

type User {
    id: Int!
    companyId: Int!
    email: String!
    abmId : Int
    phone: String!
    role: UserRole!
    name: String
    division: String
    joiningDate: String
    isAssigned: Boolean
    status: UserStatus!
    company: Company
    UserWorkingArea: [UserWorkingArea!]
    createdAt: String!
    updatedAt: String!
  }

   type WorkingArea {
  id: Int
  state: String
  city: String
  district: String
  workingArea: String
}

  type UserWorkingArea {
    id: Int
    workingAreaId: Int
    WorkingArea: WorkingArea
  }

type DailyPlanDoctor {
  id: Int!
  doctorCompanyId: Int
  DoctorCompany: DoctorCompany
  dcr : Boolean
}

type DailyPlanChemist {
  id: Int!
  chemistCompanyId: Int
  ChemistCompany: ChemistCompany
    dcr : Boolean

}

type DoctorCompany {
  id: Int!
  email: String
  phone: String
  doctor: Doctor
  doctorChemist: [DoctorChemist!]
  DoctorProduct: [DoctorProduct!]
}

type ChemistCompany {
  id: Int!
  email: String
  phone: String
  chemist: Chemist
  doctorChemist: [DoctorChemist!]
  ChemistProduct: [ChemistProduct!]
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


  input CreateDailyPlanInput {
    abmId: Int
    doctorCompanyIds: [Int!]!     
    chemistCompanyIds: [Int!]!    
    workingAreaId: Int
    workTogether: Boolean
    planDate: String!
    notes: String
  }

  input UpdateDailyPlanInput {
    dailyPlanId: Int!
    abmId: Int
    workTogether: Boolean
    notes: String
    doctorCompanyIds: [Int!]     
    chemistCompanyIds: [Int!]    
  }

  input UpdateByAbmInput {
    dailyPlanId: Int!
    isApproved: Boolean
    isRejected: Boolean
    isWorkTogetherConfirmed: Boolean
  }

  type DailyPlanResponse {
    code: Int!
    success: Boolean!
    message: String
    data: DailyPlan
  }

  type DailyPlansResponse {
    code: Int!
    success: Boolean!
    message: String
    data: [DailyPlan]
  }

  type DailyPlansForABM {
    code : Int!
    success : Boolean!
    message : String
    data : [DailyPlan]
  }

  type Query {
    getDailyPlansByCompanyId(page: Int, limit: Int): DailyPlansResponse!
    getDailyPlansByMRId(page: Int, limit: Int): DailyPlansResponse!
    getDailyPlansByABMId(page: Int, limit: Int): DailyPlansResponse!
    getDailyPlanById(id: Int!): DailyPlanResponse!

    getDailyPlansABMOfMr: DailyPlansForABM!
  }

  type Mutation {
    createDailyPlan(data: CreateDailyPlanInput!): DailyPlanResponse!
    updateDailyPlan(data: UpdateDailyPlanInput!): DailyPlanResponse!
    updateDailyPlanByAbm(data: UpdateByAbmInput!): DailyPlanResponse!
    deleteDailyPlan(dailyPlanId: Int!): DailyPlanResponse!
  }
`;
