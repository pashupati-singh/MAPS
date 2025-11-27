export const RequestTypeDefs = `#graphql
  type Request {
    id: Int!
    userId: Int
    companyId: Int
    abmId: Int
    requestType: String
    name: String
    startDate: String
    endDate: String
    productName: String
    assoicateDoc: String
    remark: String
    associates: [String]    
    requestedDate: String   
    isApproved: Boolean
    isReject: Boolean
    createdAt: String
    updatedAt: String
  }

  input CreateRequestInput {
    abmId: Int
    requestType: String!
    name: String
    startDate: String
    endDate: String
    productName: String
    assoicateDoc: String
    remark: String
    associates: [String!]      
  }

  input UpdateRequestInput {
    requestId: Int!
    abmId: Int
    requestType: String
    name: String
    startDate: String
    endDate: String
    productName: String
    assoicateDoc: String
    remark: String
    associates: [String!]       # <-- NEW
  }

  input UpdateRequestApprovalInput {
    requestId: Int!
    isApproved: Boolean
    isReject: Boolean
  }

  type RequestResponse {
    code: Int!
    success: Boolean!
    message: String
    data: Request
  }

  type RequestsResponse {
    code: Int!
    success: Boolean!
    message: String
    data: [Request]
    lastPage: Int
  }

  extend type Query {
    getRequests(page: Int, limit: Int): RequestsResponse!
  }

  extend type Mutation {
    createRequest(data: CreateRequestInput!): RequestResponse!
    updateRequest(data: UpdateRequestInput!): RequestResponse!
    deleteRequest(requestId: Int!): RequestResponse!
    updateRequestApproval(data: UpdateRequestApprovalInput!): RequestResponse!
  }
`;
