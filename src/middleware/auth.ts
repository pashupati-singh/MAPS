import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Context, TokenPayload } from "../types";

const SECRET = process.env.JWT_SECRET || "MEDICMAPS";
const prisma = new PrismaClient();

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
    return { prisma, user: null, company: null, authError: "Token not found" };
  }

  try {
    const decoded = jwt.verify(token, SECRET) as TokenPayload;
    if (typeof decoded === "object" && "id" in decoded && "role" in decoded) {
      // find company if user exists
      const userRecord = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { companyId: true },
      });

      const company =
        userRecord?.companyId !== undefined
          ? { id: userRecord.companyId }
          : null;

      return {
        prisma,
        user: decoded,
        company,
        authError: null,
      };
    }
    return { prisma, user: null, company: null, authError: "Invalid token" };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return { prisma, user: null, company: null, authError: "Token expired" };
    }
    if (err instanceof JsonWebTokenError) {
      return { prisma, user: null, company: null, authError: "Invalid token" };
    }
    return { prisma, user: null, company: null, authError: "Authentication error" };
  }
}
