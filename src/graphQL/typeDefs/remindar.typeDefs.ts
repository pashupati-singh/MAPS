export const RemindarTypeDefs = `#graphql

type Remindar {
  id: Int!
  userId: Int!
  heading: String!
  message: String!
  remindAt: String!
  createdAt: String!
  updatedAt: String!
  user: User
}

input CreateRemindarInput {
  heading: String!
  message: String!
  date: String!
  userId: Int
}

input UpdateRemindarInput {
  id: Int!
  heading: String
  message: String
  date: String
}

type RemindarResponse {
  code: Int!
  success: Boolean!
  message: String
  data: Remindar
}

type RemindarResponses {
  code: Int!
  success: Boolean!
  message: String
  data: [Remindar]
  lastPage: Int
}

extend type Query {
  getRemindars( page: Int, limit: Int): RemindarResponses!
  getTodayRemindars: RemindarResponses!
  getRemindarsByDate( date: String!): RemindarResponses!
}

extend type Mutation {
  createRemindar(data: CreateRemindarInput!): RemindarResponse!
  updateRemindar(data: UpdateRemindarInput!): RemindarResponse!
  deleteRemindar(id: Int!): RemindarResponse!
}

`