

export const CompanyTypeDefs = `#graphql

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
    address : String
    city: String
    state: String
    pinCode: String
    country: String
    landmark: String
    
  }

  input AddressInput {
    address : String
    city: String
    state: String
    pinCode: String
    country: String
    landmark: String
  }

  type Contact {
    name: String
    email: String
    phone: String
  }

  input ContactInput {
    name: String
    email: String
    phone: String
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

  input CompanyInput {
    name: String!
    legalName: String
    size: CompanySize
    website: String
    logoUrl: String
    status: CompanyStatus
    gstNumber: String
    registrationNo: String
    address: AddressInput
    contacts: [ContactInput]
    employees: Int
  }

  type Query {
    companies: [Company!]!
    company(id: Int!): Company
  }

 type Company {
    id: Int
    email: String!
    phone: String!
    status: CompanyStatus!
    isEmailVerified: Boolean!
    isPhoneVerified: Boolean!
    createdAt: String
    updatedAt: String
  }

  input RegisterCompanyInput {
    email: String!
    phone: String!
    password: String
  }

  type CompanyResponse {
    code: Int!
    success: Boolean!
    message: String
    data: Company
  }

type CompanyLoginData {
  token: String!
  company: Company!
  totalUser : Int
  totalDoc : Int
  totalChemist : Int
  totalPro : Int
}

type CompanyLoginResponse {
  code: Int!
  success: Boolean!
  message: String
  data: CompanyLoginData
}

  enum VerificationType {
    EMAIL
    PHONE
  }

type Mutation {
  registerCompany(data: RegisterCompanyInput!): CompanyResponse!
  verify(type: VerificationType!, email: String,phone : String, otpOrToken: String!): CompanyResponse!
  loginCompany(type: VerificationType!, email: String,phone: String, password: String!): CompanyLoginResponse!
  addCompany(data: CompanyInput!): CompanyResponse!
  resendVerification(type: VerificationType!, email : String, phone: String): CompanyResponse!
}

`;
