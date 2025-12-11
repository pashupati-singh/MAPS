import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import http from 'http';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';

import { typeDefs, resolvers } from './graphQL/schema';
import { createContext } from './middleware/auth';
import { Context } from './context';
import { updateMissedDailyPlans } from './utils/updateMissedDailyPlans';

const PORT = Number(process.env.PORT) || 4000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Basic middleware
  app.use(cors());
  app.use(json());

  // Apollo server
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
  });

  await server.start();

  // GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware<Context>(server, {
      // reuse your existing createContext
      context: createContext,
    }),
  );

  // Health endpoint – ping this every 5 min to keep Render awake
  app.get('/health', (_req, res) => {
    res.status(200).send('OK');
  });

  // Cron endpoint – call from cron-job.org once a day, etc.
  app.post('/cron/dailyplans/mark-missed', async (_req, res) => {
    try {
      await updateMissedDailyPlans();
      res.status(204).end(); // no body needed
    } catch (err) {
      console.error('Error in /cron/dailyplans/mark-missed:', err);
      res.status(500).end();
    }
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
    console.log(`💓 Health check at http://localhost:${PORT}/health`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});




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
