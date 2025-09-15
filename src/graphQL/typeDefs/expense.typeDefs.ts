import { gql } from "graphql-tag";

export const ExpenseTypeDefs = gql`
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
    # Get expenses within a custom date range
    getExpenseReport(companyId: Int!, startDate: String!, endDate: String!): ExpenseReport!
    getExpenseById(id: Int!): ExpenseResponse!
  }

  type Mutation {
    createExpense(data: CreateExpenseInput!): ExpenseResponse!
    approveExpense(id: Int!): ExpenseResponse!
  }
`;
