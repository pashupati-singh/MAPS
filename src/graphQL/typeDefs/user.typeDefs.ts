export const UserTypeDefs = `#graphql
scalar Upload

  enum UserRole {
    MR
    ABM
    ZM
    ADMIN
  }

  enum UserStatus {
    ACTIVE
    BLOCKED
    SUSPENDED
  }

  enum CompanySize {
    STARTUP
    SME
    ENTERPRISE
  }

  enum CompanyStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
  }

  type Address {
    address: String
    city: String
    state: String
    pinCode: String
    country: String
    landmark: String
  }

  type Contact {
    name: String
    email: String
    phone: String
  }

  type Company {
    id: Int
    name: String
    legalName: String
    size: CompanySize
    website: String
    logoUrl: String
    status: CompanyStatus
    gstNumber: String
    registrationNo: String
    address: Address
    contacts: [Contact]
    email: String
    phone: String
    employees: Int
    isEmailVerified: Boolean
    isPhoneVerified: Boolean
    createdAt: String
    updatedAt: String
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
    image: String 
    status: UserStatus!
    company: Company
    UserWorkingArea: [UserWorkingArea!]
    createdAt: String!
    updatedAt: String!
  }

  input CreateUserInput {
    email: String!
    phone: String!
    password: String!
    joiningDate: String
    role: UserRole!
  }

  type UserResponse {
    code: Int!
    success: Boolean!
    message: String
    data: User
  }

  type UserResponses {
    code: Int!
    success: Boolean!
    message: String
    data: [User]
    lastPage: Int
  }

  type AuthPayload {
    code: Int!
    success: Boolean!
    message: String!
    token: String
    user: User
    company: Company
  }

  input AssignMrsToAbmInput {
    abmId: Int!
    mrIds: [Int!]!
  }

  input UpdateUserInput {
    id: Int
    name: String
    phone: String
    division: String
    status: UserStatus
    role: UserRole
    joiningDate: String
  }

  type Query {
    getUsers(
      page: Int
      limit: Int
      search: String
      role: UserRole
      workingAreaId: Int
    ): UserResponses!
    userId(id: Int!): UserResponse!
    getAllUsers(role: UserRole, userId: Int): UserResponses!
  }

  type Remindar {
    id: Int!
    userId: Int!
    remindAt: String!
    heading: String!
    message: String
    createdAt: String!
    updatedAt: String!
  }

  type DoctorCompany {
    id: Int!
    doctorId: Int!
    companyId: Int!
    email: String
    phone: String
    type: String         
    dob: String
    anniversary: String
    approxTarget: Int
  }

  type ChemistCompany {
    id: Int!
    chemistId: Int!
    companyId: Int!
    email: String
    phone: String
    type: String        
    dob: String
    anniversary: String
    approxTarget: Int
  }

  union EventParty = DoctorCompany | ChemistCompany

  type DailyPlan {
    id: Int!
    mrId: Int!
    abmId: Int
    companyId: Int!
    isApproved: Boolean!
    workTogether: Boolean!
    isWorkTogetherConfirmed: Boolean!
    isRejected: Boolean!
    planDate: String!
    notes: String
    mr: User
  }

  input AssignDoctorChemistToUserInput {
    userId: Int!
    doctorCompanyIds: [Int!]
    chemistCompanyIds: [Int!]
  }

  type AssignDoctorChemistData {
    userId: Int!
    abmId: Int
    doctors: [DoctorCompany!]!
    chemists: [ChemistCompany!]!
  }

  type AssignDoctorChemistResponse {
    code: Int!
    success: Boolean!
    message: String
    data: AssignDoctorChemistData
  }

  scalar JSON

  type QuickAction {
    id: Int!
    quickAction: JSON!
  }

  type HomePageData {
    remindars: [Remindar!]!
    events: [EventParty!]!
    dailyplans: [DailyPlan!]!
    quickactions: QuickAction
  }

  type HomePageResponse {
    code: Int!
    success: Boolean!
    message: String
    data: HomePageData
  }

  type UpcomingEventsData {
    events: [EventParty!]!
  }

  type UpcomingEventsResponse {
    code: Int!
    success: Boolean!
    message: String
    data: UpcomingEventsData
  }

  extend type Query {
    homePage: HomePageResponse!
    upcomingEvents: UpcomingEventsResponse!
  }

  type Mutation {
    createUser(data: CreateUserInput!): UserResponse!
    updateUser(data: UpdateUserInput!, image: Upload): UserResponse!
    setMpin(mpin: String!): UserResponse!
    verifyMpin(userId: Int!, mpin: String!): AuthPayload!
    resendOtp(email: String, phone: String, type: String!): UserResponse!
    verifyOtp(type: String!, email: String, phone: String, otpOrToken: String!): UserResponse!
    loginUser(email: String!, password: String!): AuthPayload!
    assignMrsToAbm(data: AssignMrsToAbmInput!): UserResponse!
    assignDoctorChemistToUser(
      data: AssignDoctorChemistToUserInput!
    ): AssignDoctorChemistResponse!
  }
`;
