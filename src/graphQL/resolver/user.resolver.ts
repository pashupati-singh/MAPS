import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { createResponse } from "../../utils/response";
import jwt from "jsonwebtoken";
import { validatePassword } from "../../utils/validatePassword";

const prisma = new PrismaClient();

export const UserResolver = {
     Query: {
    getUsers: async (_: any, { companyId }: { companyId: number }) => {
      try {
        if (!companyId) {
          return createResponse(400, false, "Company ID is required");
        }
        const users = await prisma.user.findMany({ where: { companyId } });
        return createResponse(200, true, "Users fetched successfully", { users });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    userId: async (_: any, { id }: { id: number }) => {
      try {
        if (!id) return createResponse(400, false, "User ID is required");

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return createResponse(404, false, "User not found");

        return createResponse(200, true, "User fetched successfully", { user });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
  Mutation: {
    createUser: async (_: any, { data }: any) => {
      try {
        const { companyId, email, phone, password, role } = data;

        if (!companyId) return createResponse(400, false, "Company ID is required");
        if (!email) return createResponse(400, false, "Email is required");
        if (!phone) return createResponse(400, false, "Phone is required");
        if (!password) return createResponse(400, false, "Password is required");
        if (!role) return createResponse(400, false, "Role is required");

        if (!/^\+91[0-9]{10}$/.test(phone)) {
          return createResponse(400, false, "Phone must be in +91XXXXXXXXXX format");
        }
        const hashedPassword = await argon2.hash(password);

        const user = await prisma.user.create({
          data: {
            companyId,
            email,
            phone, 
            password: hashedPassword,
            role,
            status: "ACTIVE",
            mpin: null,
          },
        });

        return createResponse(201, true, "User created successfully", user);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    setMpin: async (_: any, { userId, mpin }: any) => {
      try {
        if (!/^[0-9]{4,6}$/.test(mpin)) {
          return createResponse(400, false, "MPIN must be 4–6 digits");
        }

        const hashedMpin = await argon2.hash(mpin);
        const user = await prisma.user.update({
          where: { id: userId },
          data: { mpin: hashedMpin },
        });

        return createResponse(200, true, "MPIN set successfully", user);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    verifyMpin: async (_: any, { userId, mpin }: any) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.mpin) {
          return createResponse(404, false, "MPIN not set");
        }

        const valid = await argon2.verify(user.mpin, mpin);
        if (!valid) return createResponse(400, false, "Invalid MPIN");

        return createResponse(200, true, "MPIN verified successfully", user);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    resendOtp: async (_: any, { userId, type }: any) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return createResponse(404, false, "User not found");

        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 10);

        if (type === "phone") {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          await prisma.user.update({
            where: { id: userId },
            data: {
              phoneVerificationCode: otp,
              phoneVerificationExpiry: expiry,
            },
          });
          console.log(`📱 OTP for ${user.phone}: ${otp}`);
        } else if (type === "email") {
          const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET!, {
            expiresIn: "1h",
          });
          await prisma.user.update({
            where: { id: userId },
            data: {
              emailVerificationToken: token,
              emailVerificationExpiry: expiry,
            },
          });
          console.log(`📧 Email verification token for ${user.email}: ${token}`);
        } else {
          return createResponse(400, false, "Invalid type (use 'phone' or 'email')");
        }

        return createResponse(200, true, `OTP sent for ${type}`);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    verifyOtp: async (_: any, { userId, type, otp }: any) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return createResponse(404, false, "User not found");

        const now = new Date();

        if (type === "phone") {
          if (
            !user.phoneVerificationCode ||
            user.phoneVerificationExpiry! < now ||
            user.phoneVerificationCode !== otp
          ) {
            return createResponse(400, false, "Invalid or expired phone OTP");
          }

          await prisma.user.update({
            where: { id: userId },
            data: {
              phoneVerificationCode: null,
              phoneVerificationExpiry: null,
            },
          });

          return createResponse(200, true, "Phone verified successfully");
        } else if (type === "email") {
          try {
            jwt.verify(otp, process.env.JWT_SECRET!);
          } catch {
            return createResponse(400, false, "Invalid or expired email token");
          }

          await prisma.user.update({
            where: { id: userId },
            data: {
              emailVerificationToken: null,
              emailVerificationExpiry: null,
            },
          });

          return createResponse(200, true, "Email verified successfully");
        }

        return createResponse(400, false, "Invalid type (use 'phone' or 'email')");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
    loginUser: async (_: any, { email,phone, password }: { email?: string; password: string , phone?: string }) => {
      try {

        if(!email && !phone) {
          return createResponse(400, false, "Email or phone is required");
        }
        if(!password) {
          return createResponse(400, false, "Password is required");
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
          return createResponse(400, false, passwordError);
        }
        
        const user = await prisma.user.findUnique({
          where: { email },
          include: { company: true },
        });

        if (!user) {
          return createResponse(404, false, "User not found");
        }
        if (!user.company.isEmailVerified) {
          return createResponse(400, false, "Please verify your email before logging in");
        }

        if (!user.company.isPhoneVerified) {
          return createResponse(400, false, "Please verify your phone number before logging in");
        }

        const now = new Date();
        const { company } = user;

        const isSubscriptionActive = company.isSubscribe && company.subscriptionEnd && company.subscriptionEnd > now;

        if (!isSubscriptionActive) {
          return createResponse(403, false, "Your subscription or trial has expired. Please renew to continue.");
        }
        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
          return createResponse(401, false, "Invalid password");
        }
        const token = jwt.sign(
          { userId: user.id, companyId: company.id, role: user.role },
          process.env.JWT_SECRET!,
          { expiresIn: "7d" }
        );

        return {
          code: 200,
          success: true,
          message: "Login successful",
          token,
          user,
          company,
        };
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
}





//  this is the code of my schema and code of typeDEfs and resolver of my user now, now we need to create a callreport in which we get the companyId, doctorId or chemistId, date (currentdate like "2025-09-20T00:00:00:0000Z" according to IST), productIds more then one ids should exist startTime and endTime these are in the string "00:00" and remark. 