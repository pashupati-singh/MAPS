import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { PrismaClient } from '@prisma/client';
import {typeDefs, resolvers} from "./graphQL/schema"
const prisma = new PrismaClient();

const server = new ApolloServer({
  typeDefs,
  resolvers,
});


const PORT = Number(process.env.PORT) || 4000;

(async () => {
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
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
