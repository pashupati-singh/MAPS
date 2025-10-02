import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { CompanyTypeDefs } from './typeDefs/company.typeDefs';
import { CompanyResolver } from './resolver/company.resolver';
import { UserTypeDefs } from './typeDefs/user.typeDefs';
import { UserResolver } from './resolver/user.resolver';
import { DoctorResolvers } from './resolver/doctor.resolver';
import { DoctorTypeDefs } from './typeDefs/doctors.typeDefs';
import { ChemistResolvers } from './resolver/chemist.resolver';
import { ChemistTypeDefs } from './typeDefs/chemist.typeDefs';


export const typeDefs = mergeTypeDefs([
    CompanyTypeDefs,
    UserTypeDefs,
    DoctorTypeDefs,
    ChemistTypeDefs
]);

export const resolvers = mergeResolvers([
    CompanyResolver,
    UserResolver,
    DoctorResolvers,
    ChemistResolvers

]);