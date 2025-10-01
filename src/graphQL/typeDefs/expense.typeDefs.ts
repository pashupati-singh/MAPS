

export const ExpenseTypeDefs = `#graphql
  enum ExpenseCategory {
    TRAVEL
    FOOD
    ACCOMMODATION
    SAMPLE
    OTHER
  }
type Expense {
  id: Int!
  userId: Int!
  companyId: Int!
  category: ExpenseCategory!
  description: String
  amount: Float!
  expenseDate: String!
  isApproved: Boolean!
  isCompleted: Boolean!  
  createdAt: String!
  updatedAt: String!
}

input CreateExpenseInput {
  userId: Int!
  companyId: Int!
  category: ExpenseCategory!
  description: String
  amount: Float!
  expenseDate: String!
}

type ExpenseResponse {
  code: Int!
  success: Boolean!
  message: String
  data: Expense
}

type ExpenseReport {
  totalAmount: Float!
  expenses: [Expense!]!
}

type Query {
  getExpenseReport(companyId: Int!, startDate: String!, endDate: String!): ExpenseReport!
  getExpenseById(id: Int!): ExpenseResponse!
}

type Mutation {
  createExpense(data: CreateExpenseInput!): ExpenseResponse!
  completeExpense(userId: Int!, companyId: Int!): ExpenseResponse! 
  approveExpense(id: Int!): ExpenseResponse!
}

`;
