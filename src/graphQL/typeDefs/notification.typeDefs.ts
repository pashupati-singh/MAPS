export const NotificationTypeDefs = `#graphql
  scalar JSON

  type Notification {
    id: Int!
    tableId: Int
    type: String
    title: String
    message: String
    date: String
    userToNotify: Int
    read: Boolean!
    notifyCreatedBy: User
    tableData: JSON
    createdAt: String
  }

  input NotificationFilterInput {
    type: String
    startDate: String # dd/mm/yyyy
    endDate: String   # dd/mm/yyyy
  }

  type NotificationResponse {
    code: Int!
    success: Boolean!
    message: String
    data: Notification
  }

  type NotificationResponses {
    code: Int!
    success: Boolean!
    message: String
    data: [Notification!]
    lastPage: Int
  }

  input MarkNotificationsReadInput {
    ids: [Int!]!
  }

  type MarkNotificationsReadResponse {
    code: Int!
    success: Boolean!
    message: String
    updatedCount: Int!
  }

  extend type Query {
    getNotifications(page: Int, limit: Int, filter: NotificationFilterInput): NotificationResponses!
    notificationById(id: Int!): NotificationResponse!
  }

  extend type Mutation {
    markNotificationsRead(data: MarkNotificationsReadInput!): MarkNotificationsReadResponse!
  }
`;
