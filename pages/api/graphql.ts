// api/index.ts
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs, resolvers } from "../../src/graphQL/schema"; // adjust if needed
import { createContext } from "../../src/middleware/auth";
import { Context } from "../../src/context";

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => createContext({ req }),
});

export default async function corsHandler(req : any, res : any) {
  // Add CORS headers
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Run Apollo handler
  return handler(req, res);
}
