// api/index.ts
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs, resolvers } from "../src/graphQL/schema"; // adjust if needed
import { createContext } from "../src/middleware/auth";
import { Context } from "../src/context";

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

export default startServerAndCreateNextHandler(server, {
  context: async (req) => createContext({ req }),
});
