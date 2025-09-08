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
