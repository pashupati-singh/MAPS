
export const CompanyCalendarTypeDefs = `#graphql
  enum MonthEnum {
    january
    february
    march
    april
    may
    june
    july
    august
    september
    october
    november
    december
  }

  enum DayTypeEnum {
    off
    on
  }

  type DateWiseCalendar {
    id: Int
    companyCalendarId: Int
    companyId: Int
    date: String
    type: DayTypeEnum
    reason: String
  }

  type CompanyCalendar {
    id: Int
    companyId: Int
    month: MonthEnum
    year: Int
    totalWorkingDate: Int
    totalOffDays: Int
    daysInMonth: Int
    inComplete: Boolean
    DateWiseCalendar: [DateWiseCalendar!]
  }

  input DateWiseCalendarInput {
    date: String! # dd/mm/yyyy
    type: DayTypeEnum!
    reason: String
  }

  input UpsertCompanyCalendarInput {
    month: MonthEnum!
    year: Int!
    dateWiseCalendar: [DateWiseCalendarInput!]!
  }

  type CompanyCalendarResponse {
    code: Int!
    success: Boolean!
    message: String
    data: CompanyCalendar
  }

  type CompanyCalendarResponses {
    code: Int!
    success: Boolean!
    message: String
    data: [CompanyCalendar!]
  }

  extend type Query {
    getCompanyCalendar( year: Int!): CompanyCalendarResponses!
  }

  extend type Mutation {
    upsertCompanyCalendars(data: [UpsertCompanyCalendarInput!]!): CompanyCalendarResponses!
  }
`;