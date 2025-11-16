

export const ProductTypeDefs = `#graphql
type Mutation {
  createProduct(input: CreateProductInput!): ProductResponse!
  assignProductToDoctor(input: AssignProductToDoctorInput!): AssignProductToDoctorResponse!
  assignProductToChemist(input: AssignProductToChemistInput!): AssignProductToChemistResponse!
  updateProduct(id: Int!, input: UpdateProductInput!): ProductResponse!
  unassignProductFromDoctor(doctorProductIds: [Int!]!): ProductResponse!
  unassignProductFromChemist(chemistProductIds: [Int!]!): ProductResponse!

}

type Query {
  getProductById(productId: Int!): ProductResponseById!
getProductsByCompany(
  page: Int
  limit: Int
  companyId: Int
  search: String
): ProductResponsePagination!
  getProductsByDoctor(doctorId: Int!): ProductResponse!
  getProductsByChemist(chemistId: Int!): ProductResponse!
}

input UpdateProductInput {
  name: String
  type: String
  salt: String
  details: JSON
}

input CreateProductInput {
  name: String!
  type: String!
  salt: String
  details: JSON
}

input AssignProductToDoctorInput {
  doctorCompanyId: Int!
  productIds: [Int!]!   
}


input AssignProductToChemistInput {
  chemistCompanyId: Int!
  productIds: [Int!]!
}

type ProductResponsePagination {
  code: Int!
  success: Boolean!
  message: String!
  data: [Product!]
  lastPage: Int
}

type ProductResponse {
  code: Int!
  success: Boolean!
  message: String!
  product: [Product!]
}

type ProductResponseById {
  code: Int!
  success: Boolean!
  message: String!
  product: Product!
}

type AssignProductToDoctorResponse {
  code: Int!
  success: Boolean!
  message: String!
  created: DoctorProduct
}

type AssignProductToChemistResponse {
  code: Int!
  success: Boolean!
  message: String!
  chemistProduct: ChemistProduct
}

type Product {
  id: Int!
  name: String!
  type: String!
  salt: String
  details: JSON
  companyId: Int!
  createdAt: String!
  updatedAt: String!
}

type DoctorProduct {
  id: Int!
  doctorCompanyId: Int!
  productId: Int!
  assignedAt: String!
}

type ChemistProduct {
  id: Int!
  chemistId: Int!
  productId: Int!
  assignedAt: String!
}
`