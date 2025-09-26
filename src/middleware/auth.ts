// import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
// import { PrismaClient } from "@prisma/client";
// import { Context } from "../context";   // <-- fix here

// const SECRET = process.env.JWT_SECRET || "MEDICMAPS";
// const prisma = new PrismaClient();

// export async function createContext({ req }: any): Promise<Context> {
//   const authHeader = req.headers["authorization"];
//   const tokenFromHeader = authHeader?.startsWith("Bearer ")
//     ? authHeader.split(" ")[1]
//     : null;

//   const token =
//     tokenFromHeader ||
//     req.headers["x-access-token"]?.toString() ||
//     (req.body as any)?.token;

//   if (!token) {
//     return { prisma, user: null, company: null, authError: "Token not found" };
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET) as { id: number; role: string };

//     const userRecord = await prisma.user.findUnique({
//       where: { id: decoded.id },
//       select: { companyId: true },
//     });

//     const company =
//       userRecord?.companyId !== undefined ? { id: userRecord.companyId } : null;

//     return {
//       prisma,
//       user: { ...decoded, companyId: userRecord?.companyId ?? 0 },
//       company,
//       authError: null,
//     };
//   } catch (err) {
//     if (err instanceof TokenExpiredError) {
//       return { prisma, user: null, company: null, authError: "Token expired" };
//     }
//     if (err instanceof JsonWebTokenError) {
//       return { prisma, user: null, company: null, authError: "Invalid token" };
//     }
//     return { prisma, user: null, company: null, authError: "Authentication error" };
//   }
// }


import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Context } from "../context";

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

  const companyIdFromHeader = req.headers["x-company-id"]
    ? parseInt(req.headers["x-company-id"].toString())
    : null;

  if (!token) {
    return {
      prisma,
      user: null,
      company: companyIdFromHeader ? { id: companyIdFromHeader } : null,
      authError: "Token not found",
    };
  }

  try {
    const decoded = jwt.verify(token, SECRET) as { id: number; role: string };

    if (companyIdFromHeader) {
      return {
        prisma,
        user: decoded ,
        company: { id: companyIdFromHeader },
        authError: null,
      };
    }

    return {
      prisma,
      user: decoded ,
      authError: null,
    };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return { prisma, user: null, company: null, authError: "Token expired" };
    }
    if (err instanceof JsonWebTokenError) {
      return { prisma, user: null, company: null, authError: "Invalid token" };
    }
    return {
      prisma,
      user: null,
      company: null,
      authError: "Authentication error",
    };
  }
}
