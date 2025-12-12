export const VisitPlanTypeDefs = `#graphql
  enum VisitPlanStatus {
    pending
    approved
    rejected
    completed
  }

  type VisitPlan {
    id: Int!
    abmId: Int
    mrId: Int
    workingAreaId: Int
    date: String
    stay: Int
    status: VisitPlanStatus!
    abm: User
    mr: User
    WorkingArea: WorkingArea
  }

  input CreateVisitPlanInput {
    workingAreaId: Int!
    date: String!   # dd/mm/yyyy
    stay: Int
  }

  input UpdateVisitPlanStatusInput {
    visitPlanId: Int!
    approve: Boolean
    rejected: Boolean
  }

  type VisitPlanResponse {
    code: Int!
    success: Boolean!
    message: String
    data: VisitPlan
  }

  type VisitPlanResponses {
    code: Int!
    success: Boolean!
    message: String
    data: [VisitPlan!]
    lastPage: Int
  }

  extend type Query {
    getVisitPlans(page: Int, limit: Int, workingAreaId: Int, date: String): VisitPlanResponses!
  }

  extend type Mutation {
    createVisitPlans(data: CreateVisitPlanInput!): VisitPlanResponses!
    updateVisitPlanStatus(data: UpdateVisitPlanStatusInput!): VisitPlanResponse!
  }
`;
