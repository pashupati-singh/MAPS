// middleware/auth.ts
import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const SECRET = process.env.JWT_SECRET || "MEDICMAPS";
const prisma = new PrismaClient();

export interface TokenPayload {
  id: number;
  role: string;
}

export interface Context {
  prisma: PrismaClient;
  user: TokenPayload | null;
  authError: string | null;
}

export async function createContext({ req }: any): Promise<Context> {
  const authHeader = req.headers["authorization"];
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const token =
    tokenFromHeader ||
    req.headers["x-access-token"]?.toString() ||
    (req.body as any)?.token;

  if (!token) {
    return { prisma, user: null, authError: "Token not found" };
  }

  try {
    const decoded = jwt.verify(token, SECRET) as TokenPayload;
    if (typeof decoded === "object" && "id" in decoded && "role" in decoded) {
      return { prisma, user: decoded, authError: null };
    }
    return { prisma, user: null, authError: "Invalid token" };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return { prisma, user: null, authError: "Token expired" };
    }
    if (err instanceof JsonWebTokenError) {
      return { prisma, user: null, authError: "Invalid token" };
    }
    return { prisma, user: null, authError: "Authentication error" };
  }
}
