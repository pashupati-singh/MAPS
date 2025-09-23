import { gql } from "graphql-tag";

export const ProductTypeDefs = gql`
type Mutation {
  createProduct(input: CreateProductInput!): ProductResponse!
  assignProductToDoctor(input: AssignProductToDoctorInput!): AssignProductToDoctorResponse!
  assignProductToChemist(input: AssignProductToChemistInput!): AssignProductToChemistResponse!
  updateProduct(id: Int!, input: UpdateProductInput!): ProductResponse!
  unassignProductFromDoctor(doctorId: Int!, productId: Int!): ProductResponse!
  unassignProductFromChemist(chemistId: Int!, productId: Int!): ProductResponse!
}

type Query {
  getProductById(productId: Int!): ProductResponse!
  getProductsByCompany: ProductResponse!
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
  doctorId: Int!
  productId: Int!
}

input AssignProductToChemistInput {
  chemistId: Int!
  productId: Int!
}

type ProductResponse {
  code: Int!
  success: Boolean!
  message: String!
  product: Product
}

type AssignProductToDoctorResponse {
  code: Int!
  success: Boolean!
  message: String!
  doctorProduct: DoctorProduct
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
  doctorId: Int!
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