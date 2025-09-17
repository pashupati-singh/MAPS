import { gql } from "graphql-tag";

export const PurchaseTypeDefs = gql`

  enum SubscriptionType {
    TRIAL
    MONTHLY
    QUARTERLY
    HALF_YEARLY
    YEARLY
  }

  enum CompanySize {
    STARTUP
    SME
    ENTERPRISE
  }

  enum CompanyStatus {
    ACTIVE
    INACTIVE
    SUSPENDED
  }

  type Address {
    address: String
    city: String
    state: String
    pinCode: String
    country: String
    landmark: String
  }
  
 type Company {
  id: Int
  name: String
  legalName: String
  size: CompanySize
  website: String
  logoUrl: String
  status: CompanyStatus
  gstNumber: String
  registrationNo: String
  address: Address
  contacts: [Contact]
  email: String
  phone: String
  employees: Int
  isEmailVerified: Boolean
  isPhoneVerified: Boolean
  createdAt: String
  updatedAt: String
}


  type PurchaseHistory {
    id: Int!
    subscriptionType: SubscriptionType!
    purchaseDate: String!
    expiryDate: String!
    amountPaid: Float
    paymentReference: String
    companyId: Int!
    company: Company
  }

  type PurchaseResponse {
    code: Int!
    success: Boolean!
    message: String
    data: PurchaseHistory
  }

  type Query {
    purchases(companyId: Int!): [PurchaseHistory!]!
  }

  type Mutation {
    purchaseSubscription(companyId: Int! type: SubscriptionType! months: Int amountPaid: Float paymentReference: String): PurchaseResponse!
  }
`;
