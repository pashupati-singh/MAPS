import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const CompanyResolver = {
  Mutation: {
    addCompany: async (_: any, { data }: any) => {
      try {
        if (!data) {
          return createResponse(400, false, "Please provide data");
        }
        if (!data.email) {
          return createResponse(404, false, "Email is required");
        }
        if (!data.phone) {
          return createResponse(404, false, "Phone number is required");
        }

        const emailVerificationToken = jwt.sign(
          { email: data.email },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1);

        const newCompany = await prisma.company.create({
          data: {
            name: data.name,
            legalName: data.legalName,
            size: data.size,
            website: data.website,
            logoUrl: data.logoUrl,
            status: data.status || "ACTIVE",
            gstNumber: data.gstNumber,
            registrationNo: data.registrationNumber,
            address: data.address ? data.address : undefined,
            contacts: data.contacts ? data.contacts : undefined,
            email: data.email,
            phone: data.phone,
            employees: data.employees || 0,
            isEmailVerified: false,
            isPhoneVerified: false,
            emailVerificationToken,
            emailVerificationExpiry: expiry,
            phoneOtp: otp,
            otpExpiry: expiry,
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
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
         
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
          const token = jwt.sign({ email: company.email }, JWT_SECRET, {
            expiresIn: "1h",
          });
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
  },
};
