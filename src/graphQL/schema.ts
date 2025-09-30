import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { CompanyTypeDefs } from './typeDefs/company.typeDefs';
import { CompanyResolver } from './resolver/company.resolver';
import { UserTypeDefs } from './typeDefs/user.typeDefs';
import { UserResolver } from './resolver/user.resolver';


export const typeDefs = mergeTypeDefs([
    CompanyTypeDefs,
    UserTypeDefs
]);

export const resolvers = mergeResolvers([
    CompanyResolver,
    UserResolver
]);