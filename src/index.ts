import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { typeDefs, resolvers } from "./graphQL/schema";
import { createContext, Context } from "./middleware/auth";

const PORT = Number(process.env.PORT) || 4000;

(async () => {
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer<Context>(server, {
    listen: { port: PORT },
    context: createContext,
  });

  console.log(`🚀 Server ready at ${url}`);
})();




// import { createYoga } from 'graphql-yoga';
// import { createServer } from 'http';
// import { PrismaClient } from '@prisma/client';
// import { makeExecutableSchema } from '@graphql-tools/schema';
// import { typeDefs, resolvers } from './graphQL/schema';

// const prisma = new PrismaClient();

// // Combine typedefs + resolvers
// const schema = makeExecutableSchema({ typeDefs, resolvers });

// // Create Yoga instance
// const yoga = createYoga({
//   schema,
//   context: ({ request }) => ({ prisma, request }),
// });

// const PORT = Number(process.env.PORT) || 4000;

// // Create HTTP server
// const server = createServer(yoga);

// server.listen(PORT, () => {
//   console.log(`🚀 Yoga server ready at http://localhost:${PORT}/graphql`);
// });
