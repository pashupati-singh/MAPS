export const ExpenseTypeDefs = `#graphql
  type Expense {
    id: Int!
    userId: Int
    companyId: Int
    ExpenseMonth: String   
    totalTA: Float
    totalDA: Float
    totalHA: Float
    totalCA: Float
    totalOA: Float
    totalMis: Float
    amount: Float
    isApproved: Boolean
    isCompleted: Boolean
    createdAt: String
    updatedAt: String
    details: [ExpenseDetails!]
  }

  type ExpenseDetails {
  id: Int
  expenseId: Int
  ta: Float
  da: Float
  ha: Float
  ca: Float
  oa: Float
  miscellaneous: Float
  reason: String
  date: String
  total: Float
}

  input CreateExpenseInput {
    ta: Float!
    da: Float!
    ha: Float!
    ca: Float!
    oa: Float!
    miscellaneous: Float
    reason: String
    dates: [String!]!
  }

  input UpdateExpenseDetailsInput {
    expenseDetailsId: Int!
    ta: Float
    da: Float
    ha: Float
    ca: Float
    oa: Float
    miscellaneous: Float
    reason: String
  }

  type ExpenseResponse {
    code: Int!
    success: Boolean!
    message: String
    data: Expense
  }

  type ExpenseListResponse {
  code: Int!
  success: Boolean!
  message: String
  data: [Expense!]
}

type ExpenseDetailsResponse {
  code: Int!
  success: Boolean!
  message: String
  data: ExpenseDetails!
}

  type Query {
    getExpenseById(id: Int!): ExpenseResponse!
    getExpenseDetailsById(id: Int!): ExpenseDetailsResponse!
    getExpenseByMonths(dates: [String!]!): ExpenseListResponse!
  }

  type Mutation {
    createExpense(data: CreateExpenseInput!): ExpenseResponse!
    completeExpense(expenseId: Int!): ExpenseResponse!
    approveExpense(expenseId: Int!): ExpenseResponse!
    updateExpenseDetails(data: UpdateExpenseDetailsInput!): ExpenseResponse!
    deleteExpenseDetails(expenseDetailsIds: [Int!]!): ExpenseResponse!
  }
`;
