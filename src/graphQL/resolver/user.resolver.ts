import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { createResponse } from "../../utils/response";
import jwt from "jsonwebtoken";
import { validatePassword } from "../../utils/validatePassword";
import { Context } from "../../context";

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
    createUser: async (_: any, { data }: any ,  context: Context) => {
      try {
        if(!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.company?.id) return createResponse(400, false, "Company authorization required");

        const companyId = context.company.id;
        const { email, phone, password, role } = data;

        if (!companyId) return createResponse(400, false, "Company ID is required");
        if (!email) return createResponse(400, false, "Email is required");
        if (!phone) return createResponse(400, false, "Phone is required");
        if (!password) return createResponse(400, false, "Password is required");
        if (!role) return createResponse(400, false, "Role is required");

        if (!/^\+91[0-9]{10}$/.test(phone)) {
          return createResponse(400, false, "Phone must be in +91XXXXXXXXXX format");
        }
        const passwordError = validatePassword(password);
        if (passwordError) {
          return createResponse(400, false, passwordError);
        }
        const hashedPassword = await argon2.hash(password);

        const otp = "123456";
        const now = new Date();
        const expiry = new Date(now.getTime() + 1 * 60 * 1000);

        const user = await prisma.user.create({
          data: {
            companyId,
            email,
            phone, 
            password: hashedPassword,
            role,
            status: "ACTIVE",
            mpin: null,
            isEmailVerified: false,
            isPhoneVerified: false,
            phoneVerificationCode: otp,
            emailVerificationToken : otp,
            phoneVerificationExpiry: expiry,
            emailVerificationExpiry: expiry
          },
        });

        return createResponse(201, true, "User created successfully", user);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    setMpin: async (_: any, { mpin }: any , context: Context) => {
      try {
        if(!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.user?.id) return createResponse(400, false, "User authorization required");

        const userId = context.user.id;
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
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { company: true },
        });
        if (!user || !user.mpin) {
          return createResponse(404, false, "MPIN not set");
        }

        if(!user.isEmailVerified) return createResponse(400, false, "Email is not verified");
        if(!user.isPhoneVerified) return createResponse(400, false, "Phone is not verified");

        if(!user.company.isSubscribe) return createResponse(400, false, "Company is not subscribed");
        if(user.company.status === "INACTIVE") return createResponse(400, false, "Company is inactive");
        if(user.company.status === "SUSPENDED") return createResponse(400, false, "Company is suspended");

        const valid = await argon2.verify(user.mpin, mpin);
        if (!valid) return createResponse(400, false, "Invalid MPIN");

        const token = jwt.sign({ id: user.id, role: user.role , companyId: user.companyId }, process.env.JWT_SECRET!, {
          expiresIn: "7d",
        })
        const data = { token, user };

        return createResponse(200, true, "MPIN verified successfully", data);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    resendOtp: async ( _: any, { type, email , phone }: { type: "EMAIL" | "PHONE"; email?: string; phone?: string } ) => {
      try {
        if(!email && !phone){
          return createResponse(400, false, "Please provide email or phone number");
        }

          const user = await prisma.user.findFirst({
                  where: type === "PHONE" ? { phone: phone } : { email: email },
                });
        
            if (!user) {
             return createResponse(404, false, "Company not found");
            }

        const expiry = new Date();
        expiry.setMinutes(expiry.getHours() + 1);

        if (type === "PHONE") {
          // const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const otp = "123456"
          await prisma.user.update({
            where: { id: user.id },
            data: {
              phoneVerificationCode: otp,
              phoneVerificationExpiry: expiry,
            },
          });
          console.log(`📲 OTP for phone ${otp}`);
          return createResponse(200, true, "OTP resent to phone");
        } else if (type === "EMAIL") {
          const token = "123456"
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailVerificationToken: token,
              emailVerificationExpiry: expiry,
            },
          });
          console.log(`📧 Email verification token for ${user.email}: ${token}`);
          return createResponse(200, true, "Verification email resent");
        } 
          return createResponse(400, false, "Invalid type (use 'PHONE' or 'EMAIL')");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    verifyOtp: async (
      _: any,
      { type, email, phone, otpOrToken }: { type: "EMAIL" | "PHONE"; email? : string; phone? : string; otpOrToken: string }
    ) => {
      try {
        if(!email && !phone){
          return createResponse(400, false, "Please provide email or phone number");
        }
        if(!otpOrToken){
          return createResponse(400, false, "Please provide otp or token");
        }

        if(!type){
          return createResponse(400, false, "Please provide verification type");
        }
        const user = await prisma.user.findUnique({ 
           where: type === "PHONE" ? { phone: phone } : { email: email },
        });
        if (!user) return createResponse(404, false, "User not found");

        const now = new Date();

        if (type === "PHONE") {
          if (
            !user.phoneVerificationCode ||
            user.phoneVerificationExpiry! < now ||
            user.phoneVerificationCode !== otpOrToken
          ) {
            return createResponse(400, false, "Invalid or expired phone OTP");
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              isPhoneVerified: true,
              phoneVerificationCode: null,
              phoneVerificationExpiry: null,
            },
          });

          return createResponse(200, true, "Phone verified successfully");
        } else if (type === "EMAIL") {
          // try {
            // jwt.verify(otp, process.env.JWT_SECRET!);
          const valid =  user.emailVerificationToken === otpOrToken
          // } catch {
          //   return createResponse(400, false, "Invalid or expired email token");
          // }
          if(!valid){
            return createResponse(400, false, "Invalid or expired email token");
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              isEmailVerified: true,
              emailVerificationToken: null,
              emailVerificationExpiry: null,
            },
          });

          return createResponse(200, true, "Email verified successfully");
        }

        return createResponse(400, false, "Invalid type (use 'PHONE' or 'EMAIL')");
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
        if (!user.isEmailVerified) {
          return createResponse(400, false, "Please verify your email before logging in");
        }

        if (!user.isPhoneVerified) {
          return createResponse(400, false, "Please verify your phone number before logging in");
        }

        const now = new Date();
        const { company } = user;

        const isSubscriptionActive = company.isSubscribe && company.subscriptionEnd && company.subscriptionEnd > now;

        if (!isSubscriptionActive) {
          return createResponse(403, false, "Company subscription or trial has expired. Please renew to continue.");
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
        const data = { token, user , company };

        return {
          code: 200,
          success: true,
          message: "Login successful",
          data,
        };
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    assignMrsToAbm: async (_: any, { data }: any , context :Context) => {
  try {
    const { abmId, mrIds } = data;

    if (!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
    if (!context.company?.id) return createResponse(400, false, "Authorization required");


    if (!abmId) return createResponse(400, false, "ABM ID is required");
    if (!mrIds || mrIds.length === 0) {
      return createResponse(400, false, "At least one MR ID is required");
    }

    const abm = await prisma.user.findUnique({ where: { id: abmId , companyId : context.company.id} });
    if (!abm) return createResponse(404, false, "ABM not found");
    if (abm.role !== "ABM") {
      return createResponse(400, false, "Provided user is not an ABM");
    }

    const mrs = await prisma.user.findMany({
      where: { id: { in: mrIds }, companyId : context.company.id },
    });

    if (mrs.length !== mrIds.length) {
      return createResponse(400, false, "One or more MR IDs are invalid");
    }

    const notMrUsers = mrs.filter(u => u.role !== "MR");
    if (notMrUsers.length > 0) {
      return createResponse(400, false, "One or more users are not MRs");
    }

    await prisma.user.updateMany({
      where: { id: { in: mrIds } },
      data: { abmId },
    });

    const updatedAbm = await prisma.user.findUnique({
      where: { id: abmId },
      include: { mrs: true },
    });

    return createResponse(200, true, "MRs assigned to ABM successfully", updatedAbm);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},
  },
}





//  this is the code of my schema and code of typeDEfs and resolver of my user now, now we need to create a callreport in which we get the companyId, doctorId or chemistId, date (currentdate like "2025-09-20T00:00:00:0000Z" according to IST), productIds more then one ids should exist startTime and endTime these are in the string "00:00" and remark. 