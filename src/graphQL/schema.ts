import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { CompanyTypeDefs } from './typeDefs/company.typeDefs';
import { CompanyResolver } from './resolver/company.resolver';


export const typeDefs = mergeTypeDefs([
    CompanyTypeDefs
]);

export const resolvers = mergeResolvers([
    CompanyResolver
]);