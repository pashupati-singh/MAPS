import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { createResponse } from "../../utils/response";
import jwt from "jsonwebtoken";
import { validatePassword } from "../../utils/validatePassword";
import { Context } from "../../context";
import { istTodayUtcRange } from "../../utils/ConvertUTCToIST";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const UserResolver = {
     Query: {
getUsers: async (
  _: any,
  args: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    workingAreaId?: number;
  },
  context: Context
) => {
  try {
    if (!context || context.authError) {
      return {
        code: 400,
        success: false,
        message: context?.authError || "Authorization Error",
        data: [],
        lastPage: 0,
      };
    }

    const companyId = context?.user?.companyId;
    const page = args.page && args.page > 0 ? args.page : 1;
    const limit = args.limit && args.limit > 0 ? args.limit : 10;

    const { search, role, workingAreaId } = args;
    const where: any = { companyId };

    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }
    if (role) {
      where.role = role;
    }
    if (typeof workingAreaId === "number") {
      where.UserWorkingArea = {
        some: {
          workingAreaId,
        },
      };
    }

    const totalUsers = await prisma.user.count({ where });
    const lastPage = Math.ceil(totalUsers / limit) || 1;
    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
      include: {
        UserWorkingArea: true,
      },
    });
    return {
      code: 200,
      success: true,
      message: "Users fetched successfully",
      data: users,
      lastPage,
    };
  } catch (err: any) {
    return {
      code: 500,
      success: false,
      message: err.message,
      data: [],
      lastPage: 0,
    };
  }
},


getAllUsers: async (_: any, args: { role?: string; userId?: number }, context: Context) => {
  try {
    if (!context || context.authError) {
      return {
        code: 400,
        success: false,
        message: context?.authError || "Authorization Error",
        data: [],
        lastPage: 0
      };
    }

    const companyId = context?.user?.companyId;
    if (!companyId) {
      return {
        code: 400,
        success: false,
        message: "Company ID missing from context",
        data: [],
        lastPage: 0
      };
    }

    const whereClause: any = { companyId };
    if (args.role) whereClause.role = args.role;

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { id: "asc" },
    });

    let result = users;
    if (args.userId) {
      const assignedUsers = await prisma.user.findMany({
        where: { abmId: args.userId, companyId },
        select: { id: true },
      });
      const assignedIds = new Set(assignedUsers.map(u => u.id));

      result = users.map(u => ({
        ...u,
        isAssigned: assignedIds.has(u.id),
      }));
    }

    return {
      code: 200,
      success: true,
      message: "All users fetched successfully",
      data: result,
      lastPage: 1 
    };
  } catch (err: any) {
    return {
      code: 500,
      success: false,
      message: err.message,
      data: [],
      lastPage: 0
    };
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
homePage: async (_: any, __: any, context: Context) => {
  try {
    if (!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
    if (!context.user?.userId) return createResponse(400, false, "User authorization required");
    if (!context.user?.companyId) return createResponse(400, false, "Company authorization required");

    const userId = context.user.userId;
    const companyId = context.user.companyId;

    const { start, end } = istTodayUtcRange();
    const remindars = await prisma.remindar.findMany({
      where: { userId, remindAt: { gte: start, lt: end } },
      orderBy: { remindAt: "asc" },
    });

    // Build today's DD/MM in IST
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
    }).formatToParts(new Date());
    const day = parts.find(p => p.type === "day")!.value;
    const month = parts.find(p => p.type === "month")!.value;
    const todayDM = `${day}/${month}`;

    const eventsDoctors = await prisma.doctorCompany.findMany({
      where: {
        companyId,
        OR: [
          { dob: { startsWith: todayDM } },
          { anniversary: { startsWith: todayDM } },
        ],
      },
      include: { doctor: true },
      orderBy: { id: "asc" },
    });

    const eventsChemist = await prisma.chemistCompany.findMany({
      where: {
        companyId,
        OR: [
          { dob: { startsWith: todayDM } },
          { anniversary: { startsWith: todayDM } },
        ],
      },
      include: { chemist: true },
      orderBy: { id: "asc" },
    });

    // ➜ ONLY CHANGE: add `type` on each item, keep structure & __typename
    const doctorEvents = eventsDoctors.map(d => {
      const isBirthday = d.dob?.startsWith(todayDM);
      const isAnniv = d.anniversary?.startsWith(todayDM);
      const type = isBirthday && isAnniv ? "both" : isBirthday ? "birthday" : "anniversary";
      return { ...d, type, __typename: "DoctorCompany" as const };
    });

    const chemistEvents = eventsChemist.map(c => {
      const isBirthday = c.dob?.startsWith(todayDM);
      const isAnniv = c.anniversary?.startsWith(todayDM);
      const type = isBirthday && isAnniv ? "both" : isBirthday ? "birthday" : "anniversary";
      return { ...c, type, __typename: "ChemistCompany" as const };
    });

    const events = [...doctorEvents, ...chemistEvents];

    const dailyplans = await prisma.dailyPlan.findMany({
      where: { companyId , mrId: userId, planDate: { gte: start, lt: end } },
      include: {
        doctors: {
          include: {
            DoctorCompany: {
              include: {
                doctor: true,
                doctorChemist: true,
                DoctorProduct: true,
              },
            },
          },
        },
        chemists: {
          include: {
            ChemistCompany: {
              include: {
                chemist: true,
                doctorChemist: true,
                ChemistProduct: true,
              },
            },
          },
        },
      },
    });

    return {
      code: 200,
      success: true,
      message: "Remindars fetched successfully",
      data: {
        remindars: remindars ?? [],
        events: events ?? [],     
        dailyplans: dailyplans ?? [],
      },
    };
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},

upcomingEvents: async (_: any, __: any, context: Context) => {
  try {
    if (!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
    if (!context.user?.userId) return createResponse(400, false, "User authorization required");
    if (!context.user?.companyId) return createResponse(400, false, "Company authorization required");

    const companyId = context.user.companyId;
    const fmtParts = (d: Date) =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
      }).formatToParts(d);

    const toDM = (d: Date) => {
      const parts = fmtParts(d);
      const day = parts.find(p => p.type === "day")!.value;
      const month = parts.find(p => p.type === "month")!.value;
      return `${day}/${month}`;
    };

    const dmList: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dmList.push(toDM(d));
    }
    const dmOr = dmList.flatMap(dm => ([
      { dob: { startsWith: dm } },
      { anniversary: { startsWith: dm } },
    ]));
    const eventsDoctors = await prisma.doctorCompany.findMany({
      where: { companyId, OR: dmOr },
      include: { doctor: true },
      orderBy: { id: "asc" },
    });

    const eventsChemist = await prisma.chemistCompany.findMany({
      where: { companyId, OR: dmOr },
      include: { chemist: true },
      orderBy: { id: "asc" },
    });
    const doctorEvents = eventsDoctors.map(d => {
      const hasBirthday = !!dmList.find(dm => d.dob?.startsWith(dm));
      const hasAnniv   = !!dmList.find(dm => d.anniversary?.startsWith(dm));
      const type = (hasBirthday && hasAnniv) ? "both" : (hasBirthday ? "birthday" : "anniversary");
      return { ...d, type, __typename: "DoctorCompany" as const };
    });

    const chemistEvents = eventsChemist.map(c => {
      const hasBirthday = !!dmList.find(dm => c.dob?.startsWith(dm));
      const hasAnniv   = !!dmList.find(dm => c.anniversary?.startsWith(dm));
      const type = (hasBirthday && hasAnniv) ? "both" : (hasBirthday ? "birthday" : "anniversary");
      return { ...c, type, __typename: "ChemistCompany" as const };
    });

    const events = [...doctorEvents, ...chemistEvents];

    return {
      code: 200,
      success: true,
      message: "Upcoming events fetched successfully",
      data: {
        events: events ?? [], 
      },
    };
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},



},
  Mutation: {
    createUser: async (_: any, { data }: any ,  context: Context) => {
      try {
        if(!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.user?.companyId) return createResponse(400, false, "Company authorization required");

        const companyId = context?.user?.companyId;
        const { email, phone, password, role , joiningDate } = data;

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
            joiningDate,
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

    updateUser: async (_: any, { data }: { data: any }, context: Context) => {
  try {
    if (!context || context.authError) {
      return createResponse(400, false, context.authError || "Authorization Error");
    } 

    const loggedInUser = context.user;
    let targetUserId = context?.user?.userId || data.id;

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId, companyId: loggedInUser?.companyId },
      data: {
        name: data.name ?? undefined,
        phone: data.phone ?? undefined,
        division: data.division ?? undefined,
        status: data.status ?? undefined,
        role: data.role ?? undefined,
        joiningDate: data.joiningDate ?? undefined
      },
    });

    return createResponse(200, true, "User updated successfully", updatedUser);

  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},

    setMpin: async (_: any, { mpin }: any , context: Context) => {
      try {
        if(!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
        if (!context.user?.userId) return createResponse(400, false, "User authorization required");

        const userId = context.user.userId;
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

        // if(!user.company.isSubscribe) return createResponse(400, false, "Company is not subscribed");
        if(user.company.status === "INACTIVE") return createResponse(400, false, "Company is inactive");
        if(user.company.status === "SUSPENDED") return createResponse(400, false, "Company is suspended");

        const valid = await argon2.verify(user.mpin, mpin);
        if (!valid) return createResponse(400, false, "Invalid MPIN");

        const token = jwt.sign({ userId: user.id, role: user.role , companyId: user.companyId }, JWT_SECRET, {
          expiresIn: "7d",
        })

        return {
           code: 200,
          success: true,
          message: "Login successful",
          token,
          user
        };
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
        expiry.setHours(expiry.getHours() + 1);

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

        // const isSubscriptionActive = company.isSubscribe && company.subscriptionEnd && company.subscriptionEnd > now;

        // if (!isSubscriptionActive) {
        //   return createResponse(403, false, "Company subscription or trial has expired. Please renew to continue.");
        // }
        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) { 
          return createResponse(401, false, "Invalid password");
        }
        const token = jwt.sign(
          { userId: user.id, companyId: company.id, role: user.role },
          JWT_SECRET ,
          { expiresIn: "7d" }
        );

       

        return {
          code: 200,
          success: true,
          message: "Login successful",
          token,
          user,
        };
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

   assignMrsToAbm: async (_: any, { data }: any, context: Context) => {
  try {
    const { abmId, mrIds } = data;
    if (!context || context.authError) return createResponse(400, false, context.authError || "Authorization Error");
    if (!context.user?.companyId) return createResponse(400, false, "Authorization required");

    if (!abmId) return createResponse(400, false, "ABM ID is required");
    if (!mrIds || mrIds.length === 0) return createResponse(400, false, "At least one MR ID is required");

    const abm = await prisma.user.findUnique({ where: { id: abmId, companyId: context.user.companyId } });
    if (!abm) return createResponse(404, false, "ABM not found");
    if (abm.role !== "ABM") return createResponse(400, false, "Provided user is not an ABM");

    const mrs = await prisma.user.findMany({
      where: { id: { in: mrIds }, companyId: context.user.companyId },
    });
    if (mrs.length !== mrIds.length) return createResponse(400, false, "One or more MR IDs are invalid");

    const notMrUsers = mrs.filter(u => u.role !== "MR");
    if (notMrUsers.length > 0) return createResponse(400, false, "One or more users are not MRs");

    await prisma.user.updateMany({
      where: { abmId, companyId: context.user.companyId },
      data: { abmId: null },
    });

    await prisma.user.updateMany({
      where: { id: { in: mrIds }, companyId: context.user.companyId },
      data: { abmId },
    });

    const updatedAbm = await prisma.user.findUnique({
      where: { id: abmId },
      include: { mrs: true },
    });

    return createResponse(200, true, "MR assignments updated successfully", updatedAbm);
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
}

  },

  EventParty: {
    __resolveType(obj: any) {
      if (obj?.__typename) return obj.__typename; // fastest path
      if (obj?.doctorId !== undefined && obj?.doctorId !== null) return "DoctorCompany";
      if (obj?.chemistId !== undefined && obj?.chemistId !== null) return "ChemistCompany";
      return null; // unresolved item => GraphQL error
    },
  },
}
