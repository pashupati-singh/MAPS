import { gql } from "graphql-tag";

export const DailyPlanTypeDefs = gql`
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
    updatedAt: String!
    doctorIds: [Int!]!     # Array of related doctor IDs
    chemistIds: [Int!]!    # Array of related chemist IDs
  }

  input CreateDailyPlanInput {
    mrId: Int!
    abmId: Int
    companyId: Int!
    doctorIds: [Int!]!    # Array of doctor IDs
    chemistIds: [Int!]!   # Array of chemist IDs
    workTogether: Boolean
    planDate: String!
    notes: String
  }

  input UpdateDailyPlanInput {
    id: Int!
    notes: String
    doctorIds: [Int!]    # Optional: update list of doctors
    chemistIds: [Int!]   # Optional: update list of chemists
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

  input UpdateByAbmInput {
  id: Int!
  isApproved: Boolean
  isRejected: Boolean
  isWorkTogetherConfirmed: Boolean
}

  type Query {
    getDailyPlans(companyId: Int!): DailyPlansResponse!
    getDailyPlanById(id: Int!): DailyPlanResponse!
  }

  type Mutation {
    createDailyPlan(data: CreateDailyPlanInput!): DailyPlanResponse!
    updateDailyPlan(data: UpdateDailyPlanInput!): DailyPlanResponse!
    updateDailyPlanByAbm(data: UpdateByAbmInput!): DailyPlanResponse!
    deleteDailyPlan(id: Int!): DailyPlanResponse!
  }
`;
