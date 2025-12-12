export const VisitPlanTypeDefs = `#graphql
  type VisitPlan {
    id: Int!
    abmId: Int
    mrId: Int
    workingAreaId: Int
    date: String
    visitComplete: Boolean!
    isApprove: Boolean!
    abm: User
    mr: User
    workingArea: WorkingArea
  }

  input CreateVisitPlanInput {
    workingAreaId: Int!
    date: String!
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
    approveVisitPlan(visitPlanId: Int!): VisitPlanResponse!
  }
`;
