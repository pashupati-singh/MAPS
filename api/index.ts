// import { ApolloServer } from "@apollo/server";
// import { startServerAndCreateNextHandler } from "@as-integrations/next";
// import { typeDefs, resolvers } from "../src/graphQL/schema";
// import { createContext } from "../src/middleware/auth";
// import { Context } from "../src/context";

// const server = new ApolloServer<Context>({
//   typeDefs,
//   resolvers,
// });

// export default startServerAndCreateNextHandler(server, {
//   context: async (req) => createContext({ req }),
// });


// api/index.ts
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs, resolvers } from "../src/graphQL/schema";
import { createContext } from "../src/middleware/auth";
import { Context } from "../src/context";

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

// Wrap handler to inject CORS headers
const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => createContext({ req }),
});

export default async function corsHandler(req : any, res : any) {
  // Add CORS headers
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://e4ce71f3-b3b4-4898-8396-af32c0410c35.lovableproject.com"
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
