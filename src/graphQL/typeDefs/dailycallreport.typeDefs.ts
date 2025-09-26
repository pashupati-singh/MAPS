import { gql } from "graphql-tag";

export const DailyCallReportTypeDefs = gql`
  enum ReportType {
    CALL
    APPOINTMENT
    REMINDER
  }

  type DailyCallReport {
    id: Int!
    dailyPlanId: Int!
    mrId: Int!
    abmId: Int
    doctorId: Int
    chemistId: Int
    typeOfReport: ReportType!
    reportDate: String!
    reportStartTime: String!
    reportEndTime: String!
    duration: Int!
    remarks: String
    latitudeMR: Float
    longitudeMR: Float
    latitudeABM: Float
    longitudeABM: Float
    products: [Int!]!
    mrReportCompleted: Boolean!
    abmReportCompleted: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  input CreateDcrInput {
    dailyPlanId: Int!
    doctorId: Int
    chemistId: Int
    typeOfReport: ReportType!
    reportStartTime: String!
    reportEndTime: String!
    products: [Int!]!
    remarks: String
    latitude: Float
    longitude: Float
  }

  input UpdateDcrByAbmInput {
    dcrId: Int!
    reportStartTime: String!
    reportEndTime: String!
    remarks: String
    latitude: Float
    longitude: Float
    products: [Int!]!
  }

  type DailyCallReportResponse {
    code: Int!
    success: Boolean!
    message: String
    data: DailyCallReport
  }

  type DailyCallReportListResponse {
    code: Int!
    success: Boolean!
    message: String
    data: [DailyCallReport!]
  }

  type Query {
    getDcrById(id: Int!): DailyCallReportResponse!
    getDcrsByMr(mrId: Int!): DailyCallReportListResponse!
    getDcrsByDoctor(doctorId: Int!): DailyCallReportListResponse!
    getDcrsByChemist(chemistId: Int!): DailyCallReportListResponse!
    getDcrsByDailyPlan(dailyPlanId: Int!): DailyCallReportListResponse!
  }

  type Mutation {
    createDcr(data: CreateDcrInput!): DailyCallReportResponse!
    updateDcrByAbm(data: UpdateDcrByAbmInput!): DailyCallReportResponse!
  }
`;
