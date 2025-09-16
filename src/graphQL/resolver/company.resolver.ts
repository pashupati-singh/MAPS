import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { createResponse } from "../../utils/response";
import jwt from "jsonwebtoken";
import { Context } from "../../context";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const CompanyResolver = {
  Mutation: {
     registerCompany: async (_: any, { data }: any) => {
  try {
    const { email, phone, password, status } = data;

    const existing = await prisma.company.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existing) {
      return {
        code: 400,
        success: false,
        message: "Email or phone already exists",
        data: null,
      };
    }

    const hashedPassword = await argon2.hash(password);

    const emailToken = "123456";
    const phoneOtp = "123456";

    const company = await prisma.company.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        status: status || "ACTIVE",
        isEmailVerified: false,
        isPhoneVerified: false,
        emailVerificationToken: emailToken,
        emailVerificationExpiry: new Date(Date.now() + 1000 * 60 * 60),
        phoneOtp,
        otpExpiry: new Date(Date.now() + 1000 * 60 * 10),
      },
    });

    return {
      code: 200,
      success: true,
      message: "Company registered successfully. Please verify your email and phone.",
      data: company,
    };
  } catch (error) {
    console.error(error);
    return {
      code: 500,
      success: false,
      message: "Internal server error",
      data: null,
    };
  }
},

   resendVerification: async ( _: any, { type, email , phone }: { type: "EMAIL" | "PHONE"; email?: string; phone?: string } ) => {
      try {
        if(!email && !phone){
          return createResponse(400, false, "Please provide email or phone number");
        }

        const company = await prisma.company.findFirst({
          where: type === "PHONE" ? { phone: phone } : { email: email },
        });

        if (!company) {
          return createResponse(404, false, "Company not found");
        }

        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1);

        if (type === "PHONE") {
          // const otp = Math.floor(100000 + Math.random() * 900000).toString();
         const otp = "123456";
          await prisma.company.update({
            where: { id: company.id },
            data: {
              phoneOtp: otp,
              otpExpiry: expiry,
            },
          });

          console.log(`📲 OTP for phone ${otp}`);
          return createResponse(200, true, "OTP resent to phone");
        }
        const expiryOtp = new Date();
        expiryOtp.setHours(expiry.getHours() + 1);
        if (type === "EMAIL") {
          // const token = jwt.sign({ email: company.email }, JWT_SECRET, {
          //   expiresIn: "1h",
          // });
          const token = "123456";
          await prisma.company.update({
            where: { id: company.id },
            data: {
              emailVerificationToken: token,
              emailVerificationExpiry: expiry,
            },
          });

          console.log(`📧 Token for email ${token}`);
          return createResponse(200, true, "Verification email resent");
        }

        return createResponse(400, false, "Invalid verification type");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    verify: async (
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

        const company = await prisma.company.findFirst({
          where: type === "PHONE" ? { phone: phone } : { email: email },
        });

        if (!company) {
          return createResponse(404, false, "Company not found");
        }

        if (type === "PHONE") {
          if (
            !company.phoneOtp ||
            !company.otpExpiry ||
            company.otpExpiry < new Date()
          ) {
            return createResponse(400, false, "OTP expired or not generated");
          }

          if (company.phoneOtp !== otpOrToken) {
            return createResponse(400, false, "Invalid OTP");
          }

          await prisma.company.update({
            where: { id: company.id },
            data: {
              isPhoneVerified: true,
              phoneOtp: null,
              otpExpiry: null,
            },
          });

          return createResponse(200, true, "Phone verified successfully");
        }

        if (type === "EMAIL") {
          try {
            jwt.verify(otpOrToken, JWT_SECRET);
          } catch {
            return createResponse(400, false, "Invalid or expired token");
          }

          if (
            !company.emailVerificationExpiry ||
            company.emailVerificationExpiry < new Date()
          ) {
            return createResponse(400, false, "Email verification token expired");
          }

          await prisma.company.update({
            where: { id: company.id },
            data: {
              isEmailVerified: true,
              emailVerificationToken: null,
              emailVerificationExpiry: null,
            },
          });

          return createResponse(200, true, "Email verified successfully");
        }

        return createResponse(400, false, "Invalid verification type");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    loginCompany: async (_: any, { email, password }: any) => {
      try {
        if(!email){
          return createResponse(400, false, "Please provide email");
        }
        if(!password){
          return createResponse(400, false, "Please provide password");
        }
        const company = await prisma.company.findUnique({
          where: { email },
        });

        if (!company) {
          return createResponse(404, false, "Company not found");
        }
         if (company.status === "INACTIVE") {
            return createResponse(400, false, "Company is inactive");
          }
          if(company.status === "SUSPENDED"){
            return createResponse(400, false, "Company is suspended");
          }

        if (!company.isEmailVerified) {
          return createResponse(400, false, "Please verify your email before logging in");
        }

        if (!company.isPhoneVerified) {
          return createResponse(400, false, "Please verify your phone number before logging in");
        }

        const isPasswordValid = await argon2.verify(company.password, password);
        if (!isPasswordValid) {
          return createResponse(400, false, "Invalid password");
        }

        const token = jwt.sign({ companyId : company.id }, JWT_SECRET, {
          expiresIn: "7h",
        });
        const data = {
          ...company,
          token,
        };
        return createResponse(200, true, "Company logged in successfully", data);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    addCompany: async (_: any, { data }: any, context:Context) => {
      try {
        if(!context){
          return createResponse(400, false, "Authorization Error");
        }
        if(!context.user){
          return createResponse(400, false, "Authorization Error");
        }
        const { id , role} = context.user;
        if (!data) {
          return createResponse(400, false, "Please provide data");
        }
        const company = await prisma.company.findFirst({
          where: { id },
        });
        if (!company) {
          return createResponse(400, false, "Company not found");
        }

        if (company.status === "INACTIVE") {
          return createResponse(400, false, "Company is inactive");
        }
        if (company.status === "SUSPENDED") {
          return createResponse(400, false, "Company is suspended");
        }
        const newCompany = await prisma.company.create({
          data: {
            name: data.name,
            legalName: data.legalName,
            size: data.size,
            website: data.website,
            logoUrl: data.logoUrl,
            status: company.status || "ACTIVE",
            gstNumber: data.gstNumber,
            registrationNo: data.registrationNumber,
            address: data.address ? data.address : undefined,
            contacts: data.contacts ? data.contacts : undefined,
            email: company.email,
            password : company.password,
            phone: company.phone,
            employees: data.employees || 0,
          },
        });

        return createResponse(
          200,
          true,
          "Company created successfully. Please verify your email.",
          newCompany
        );
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

  },
};
