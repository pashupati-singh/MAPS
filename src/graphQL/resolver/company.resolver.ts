import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { createResponse } from "../../utils/response";
import jwt from "jsonwebtoken";
import { Context } from "../../context";
import { validatePassword } from "../../utils/validatePassword";
import { validateIndianPhoneNumber } from "../../utils/validatePhoneNumber";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const CompanyResolver = {
  Mutation: {
     registerCompany: async (_: any, { data }: any) => {
  try {
    const { email, phone, password } = data;
    if(!email) return createResponse(400, false, "Please provide email");
    if(!phone) return createResponse(400, false, "Please provide phone number");
    if(!password) return createResponse(400, false, "Please provide password");
    if(!email.includes("@")) return createResponse(400, false, "Please provide valid email");
    if(email) email.toLowerCase();
    const validationPhone = await validateIndianPhoneNumber(phone);
    if(!validationPhone) return createResponse(400, false, "The number should start with +91, followed by 10 digits.");
    const passwordError = validatePassword(password);
        if (passwordError) {
          return createResponse(400, false, passwordError);
        }

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
        status: "ACTIVE",
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
        if(phone){
          const validationPhone = await validateIndianPhoneNumber(phone);
          if(!validationPhone) return createResponse(400, false, "The number should start with +91, followed by 10 digits.");
        }
        if(type){
          type.toUpperCase();
        }
        if(email){
          email.toLowerCase();
        }

        const company = await prisma.company.findFirst({
          where: type === "PHONE" ? { phone: phone } : { email: email },
        });

        if (!company) {
          return createResponse(404, false, "Company not found");
        }
        if(type === "PHONE" && company.isPhoneVerified) return createResponse(400, false, "Phone number already verified");
        if(type === "EMAIL" && company.isEmailVerified) return createResponse(400, false, "Email already verified");
        if(type === "PHONE" && !phone) return createResponse(400, false, "please provide phone number");
        if(type === "EMAIL" && !email) return createResponse(400, false, "please provide email");
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
        if (type === "EMAIL") {
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
         if(phone){
          const validationPhone = await validateIndianPhoneNumber(phone);
          if(!validationPhone) return createResponse(400, false, "The number should start with +91, followed by 10 digits.");
        }
        if(type){
          type.toUpperCase();
        }
        if(email){
          email.toLowerCase();
        }
        if(type === "PHONE" && !phone) return createResponse(400, false, "please provide phone number");
        if(type === "EMAIL" && !email) return createResponse(400, false, "please provide email");

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
            return createResponse(400, false, "OTP expired");
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
          // try {
          //   jwt.verify(otpOrToken, JWT_SECRET);

          // } catch {
          //   return createResponse(400, false, "Invalid or expired token");
          // }
         if(company.emailVerificationToken !== otpOrToken) return createResponse(400, false, "Invalid token");
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

   loginCompany: async (_: any, { email, password, phone, type }: any) => {
  try {
    type = type?.toUpperCase();

    if (!type) {
      return createResponse(400, false, "Please provide login type");
    }

    if (type === "EMAIL") {
      if (!email) {
        return createResponse(400, false, "Please provide email");
      }
      email = email.toLowerCase();
    }

    if (type === "PHONE") {
      if (!phone) {
        return createResponse(400, false, "Please provide phone number");
      }
      const isValidPhone = validateIndianPhoneNumber(phone);
      if (!isValidPhone) {
        return createResponse(
          400,
          false,
          "The number should start with +91 and have exactly 10 digits."
        );
      }
    }

    if (!password) {
      return createResponse(400, false, "Please provide password");
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return createResponse(400, false, passwordError);
    }

          const company = await prisma.company.findFirst({
          where: type === "PHONE" ? { phone: phone } : { email: email },
        });

    if (!company) {
      return createResponse(404, false, "Company not found");
    }

    if (company.status === "INACTIVE") {
      return createResponse(400, false, "Company is inactive");
    }

    if (company.status === "SUSPENDED") {
      return createResponse(400, false, "Company is suspended");
    }

    if (!company.isEmailVerified) {
      return createResponse(
        400,
        false,
        "Please verify your email before logging in"
      );
    }

    if (!company.isPhoneVerified) {
      return createResponse(
        400,
        false,
        "Please verify your phone number before logging in"
      );
    }

    if(!company.password) return createResponse(400, false, "Password not found");

    const isPasswordValid = await argon2.verify(company?.password , password);
    if (!isPasswordValid) {
      return createResponse(400, false, "Invalid password");
    }

    const token = jwt.sign({ companyId: company.id }, JWT_SECRET, {
      expiresIn: "7h",
    });
    const data = {token , company}; 
    return {
      code: 200,
      success: true,
      message: "Company logged in successfully",
      data,
    }
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
   },


   addCompany: async (_: any, { data }: any, context: Context) => {
   try {
    if (!context || context.authError) {
      return createResponse(400, false, context.authError || "Authorization Error");
    }
    if (!context.user?.companyId) {
      return createResponse(400, false, "Company authorization required");
    }

    const company = await context.prisma.company.findUnique({
      where: { id: context?.user?.companyId },
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

  const updatedCompany = await context.prisma.company.update({
  where: { id: context.user.companyId },
  data: {
        name: data.name,
        legalName: data.legalName,
        size: data.size,
        website: data.website,
        logoUrl: data.logoUrl,
        status: company.status || "ACTIVE",
        gstNumber: data.gstNumber,
        registrationNo: data.registrationNumber,
        address: data.address || undefined,
        contacts: data.contacts || undefined,
        employees: data.employees || 0,
        email : company.email,
        phone : company.phone
      },
    });

    return createResponse(
      200,
      true,
      "Company created successfully. Please verify your email.",
      updatedCompany
    );
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},


  },
};
