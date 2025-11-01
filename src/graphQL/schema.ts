import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { CompanyTypeDefs } from './typeDefs/company.typeDefs';
import { CompanyResolver } from './resolver/company.resolver';
import { UserTypeDefs } from './typeDefs/user.typeDefs';
import { UserResolver } from './resolver/user.resolver';
import { DoctorResolvers } from './resolver/doctor.resolver';
import { DoctorTypeDefs } from './typeDefs/doctors.typeDefs';
import { ChemistResolvers } from './resolver/chemist.resolver';
import { ChemistTypeDefs } from './typeDefs/chemist.typeDefs';
import { ProductTypeDefs } from './typeDefs/product.typeDefs';
import { ProductResolvers } from './resolver/product.resolver';
import { DailyPlanTypeDefs } from './typeDefs/dailyPlans.typeDefs';
import { DailyPlanResolver } from './resolver/dailyPlans.resolver';
import { DailyCallReportResolver } from './resolver/dailyCallReport.resolver';
import { DailyCallReportTypeDefs } from './typeDefs/dailycallreport.typeDefs';
import { RemindarTypeDefs } from './typeDefs/remindar.typeDefs';
import { RemindarResolver } from './resolver/remindar.resolver';


export const typeDefs = mergeTypeDefs([
    CompanyTypeDefs,
    UserTypeDefs,
    DoctorTypeDefs,
    ChemistTypeDefs,
    ProductTypeDefs,
    DailyPlanTypeDefs,
    DailyCallReportTypeDefs,
    RemindarTypeDefs
]);

export const resolvers = mergeResolvers([
    CompanyResolver,
    UserResolver,
    DoctorResolvers,
    ChemistResolvers,
    ProductResolvers,
    DailyPlanResolver,
    DailyCallReportResolver,
    RemindarResolver

]);