export const DateSummaryTypeDefs = `#graphql
  type Request {
    id: Int!
    userId: Int
    companyId: Int
    requestType: String
    name: String
    startDate: String
    endDate: String
    productName: String
    abmId: Int
    isApproved: Boolean
    isReject: Boolean
    assoicateDoc: String
    remark: String
    associates: [String!]
    requestedDate: String!
  }

  type ExpenseDetails {
    id: Int!
    expenseId: Int
    ta: Float
    da: Float
    ha: Float
    ca: Float
    oa: Float
    date: String
    miscellaneous: Float
    reason: String
    total: Float
  }

  type Sale {
    id: Int!
    mrId: Int!
    companyId: Int!
    totalAmount: Float
    orderDate: String!
  }

  type DateSummaryData {
    date: String!
    dailyPlans: [DailyPlan!]!
    remindars: [Remindar!]!
    requests: [Request!]!
    expenseDetails: [ExpenseDetails!]!
    sales: [Sale!]!
  }

  type DateSummaryResponse {
    code: Int!
    success: Boolean!
    message: String
    data: DateSummaryData
  }

  extend type Query {
    dateSummary(date: String!): DateSummaryResponse!
  }
`;
