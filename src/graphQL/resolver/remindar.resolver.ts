import { PrismaClient } from "@prisma/client";
import { createResponse } from "../../utils/response";
import { Context } from "../../context";
import { istTodayUtcRange, toUtcMidnight } from "../../utils/ConvertUTCToIST";

const prisma = new PrismaClient();



export const RemindarResolver = {
  Query: {
    getRemindars: async (_: any, args: { page?: number; limit?: number }, context: Context) => {
      try {
        if (!context || context.authError) {
          return { code: 400, success: false, message: context?.authError || "Authorization Error", data: [], lastPage: 0 };
        }
        const companyId = context.user?.companyId;
        if (!companyId) return { code: 400, success: false, message: "Company authorization required", data: [], lastPage: 0 };
        if(!context.user?.userId) return { code: 400, success: false, message: "User authorization required", data: [], lastPage: 0 };
        const  userId  = context.user?.userId;
        const page = args.page && args.page > 0 ? args.page : 1;
        const limit = args.limit && args.limit > 0 ? args.limit : 10;

        const total = await prisma.remindar.count({
          where: { userId, User: { companyId } },
        });
        const lastPage = Math.max(1, Math.ceil(total / limit));

        const rows = await prisma.remindar.findMany({
          where: { userId, User: { companyId } },
          orderBy: { id: "desc" },                
          skip: (page - 1) * limit,
          take: limit,
        });

        return { code: 200, success: true, message: "Remindars fetched", data: rows, lastPage };
      } catch (err: any) {
        return { code: 500, success: false, message: err.message, data: [], lastPage: 0 };
      }
    },

    getTodayRemindars: async (_: any, __: any, context: Context) => {
      try {
        if (!context || context.authError)
          return createResponse(400, false, context?.authError || "Authorization Error");

        const companyId = context.user?.companyId;
        if (!companyId)
          return createResponse(400, false, "Company authorization required");
        if (!context.user?.userId)
          return createResponse(400, false, "User authorization required");

        const userId = context.user.userId;

        const { start, end } = istTodayUtcRange();
        const rows = await prisma.remindar.findMany({
          where: {
            userId,
            remindAt: {
              gte: start,
              lt: end
            },
          },
          orderBy: { remindAt: "desc" },
        });

        return {
          code: 200,
          success: true,
          message: "Today's remindars fetched",
          data: rows,
          lastPage: 1,
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

    getRemindarsByDate: async (_: any, {date }: { date: string }, context: Context) => {
      try {
        if (!context || context.authError) return createResponse(400, false, context?.authError || "Authorization Error");
        const companyId = context.user?.companyId;
        if (!companyId) return createResponse(400, false, "Company authorization required");
        if(!context.user?.userId) return createResponse(400, false, "User authorization required");

        const userId = context.user?.userId;
        const start = toUtcMidnight(date);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

        const rows = await prisma.remindar.findMany({
          where: { userId, 
          remindAt: { gte: start, lt: end } 
        },
          orderBy: { remindAt: "asc" },
        });

        return { code: 200, success: true, message: "Date-wise remindars fetched", data: rows, lastPage: 1 };
      } catch (err: any) {
        return { code: 500, success: false, message: err.message, data: [], lastPage: 0 };
      }
    },
  },

  Mutation: {
    createRemindar: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context || context.authError) return createResponse(400, false, context?.authError || "Authorization Error");
        const companyId = context.user?.companyId;
        if (!companyId) return createResponse(400, false, "Company authorization required");

        const userId = data.userId ?? context.user?.userId;
        if (!userId) return createResponse(400, false, "userId is required");

        const remindAt = toUtcMidnight(data.date); 
        const row = await prisma.remindar.create({
          data: {
            userId,
            heading: data.heading,
            message: data.message,
            remindAt,
          },
          include: {User : true}
        });

        return createResponse(201, true, "Remindar created", row);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    updateRemindar: async (_: any, { data }: any, context: Context) => {
      try {
        if (!context || context.authError) return createResponse(400, false, context?.authError || "Authorization Error");
        const companyId = context.user?.companyId;
        if (!companyId) return createResponse(400, false, "Company authorization required");
        if (!data?.id) return createResponse(400, false, "id is required");

        const existing = await prisma.remindar.findFirst({
          where: { id: data.id, User: { companyId } },
        });
        if (!existing) return createResponse(404, false, "Remindar not found");

        const updateData: any = {
          heading: data.heading ?? undefined,
          message: data.message ?? undefined,
        };
        if (data.date) updateData.remindAt = toUtcMidnight(data.date); 

        const row = await prisma.remindar.update({
          where: { id: data.id },
          data: updateData,
        });

        return createResponse(200, true, "Remindar updated", row);
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    deleteRemindar: async (_: any, { id }: { id: number }, context: Context) => {
      try {
        if (!context || context.authError) return createResponse(400, false, context?.authError || "Authorization Error");
        const companyId = context.user?.companyId;
        if (!companyId) return createResponse(400, false, "Company authorization required");
        const row = await prisma.remindar.findFirst({ where: { id, User: { companyId } } });
        if (!row) return createResponse(404, false, "Remindar not found");

        await prisma.remindar.delete({ where: { id } });
        return createResponse(200, true, "Remindar deleted", { id });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};




// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// --- REQUESTS (MR raises → ABM approves) ---
// model Request {
//   id              Int               @id @default(autoincrement())
//   companyId       Int
//   mrId            Int
//   abmId           Int?                                // usually MR.abmId
//   type            RequestType
//   status          RequestStatus       @default(PENDING)
//   priority        RequestPriority?    @default(NORMAL)
//   title           String
//   details         Json?                              // flexible payload (see notes)
//   doctorCompanyId Int?
//   chemistCompanyId Int?
//   productId       Int?
//   startAt         DateTime?                          // e.g., leave from / appointment time
//   endAt           DateTime?
//   abmRequired     Boolean?            @default(false) // “you are required in that appointment”
//   createdAt       DateTime            @default(now())
//   updatedAt       DateTime            @updatedAt
//   decidedAt       DateTime?
//   decisionNote    String?

//   company         Company             @relation(fields: [companyId], references: [id])
//   mr              User                @relation(fields: [mrId], references: [id])
//   abm             User?               @relation(fields: [abmId], references: [id])
//   doctorCompany   DoctorCompany?      @relation(fields: [doctorCompanyId], references: [id])
//   chemistCompany  ChemistCompany?     @relation(fields: [chemistCompanyId], references: [id])
//   product         Product?            @relation(fields: [productId], references: [id])
//   actions         RequestAction[]

//   @@index([companyId, mrId, status, type])
//   @@index([abmId, status])
// }

// model RequestAction {
//   id         Int           @id @default(autoincrement())
//   requestId  Int
//   actorId    Int                                  // who performed action
//   action     RequestActionType
//   note       String?
//   createdAt  DateTime      @default(now())
//   request    Request       @relation(fields: [requestId], references: [id])
//   actor      User          @relation(fields: [actorId], references: [id])
// }

// enum RequestType {
//   LEAVE
//   APPOINTMENT_DOCTOR
//   APPOINTMENT_CHEMIST
//   STOCK_ALERT
//   ACTIVITY              // generic “some activity with doctor” etc.
// }

// enum RequestStatus {
//   PENDING
//   APPROVED
//   REJECTED
//   CANCELLED
// }

// enum RequestPriority {
//   LOW
//   NORMAL
//   HIGH
// }

// enum RequestActionType {
//   CREATED
//   UPDATED
//   APPROVED
//   REJECTED
//   CANCELLED
//   COMMENTED
// }

// // --- TOUR PLANS (ABM creates → MR accepts/rejects) ---
// model TourPlan {
//   id          Int                 @id @default(autoincrement())
//   companyId   Int
//   abmId       Int
//   title       String
//   area        String?                                 // e.g., HQ/territory/route
//   description String?
//   startDate   DateTime
//   endDate     DateTime
//   status      TourPlanStatus       @default(DRAFT)
//   itinerary   Json?                                   // optional day-wise plan: [{date, hq, doctors:[...], chemists:[...]}]
//   createdAt   DateTime             @default(now())
//   updatedAt   DateTime             @updatedAt
//   publishedAt DateTime?

//   company     Company              @relation(fields: [companyId], references: [id])
//   abm         User                 @relation(fields: [abmId], references: [id])
//   participants TourPlanParticipant[]

//   @@index([companyId, startDate, endDate, status])
// }

// model TourPlanParticipant {
//   id           Int               @id @default(autoincrement())
//   tourPlanId   Int
//   mrId         Int
//   status       TourPlanRSVP       @default(PENDING)   // MR accept/reject
//   respondedAt  DateTime?
//   emailSentAt  DateTime?
//   comment      String?

//   tourPlan     TourPlan          @relation(fields: [tourPlanId], references: [id])
//   mr           User              @relation(fields: [mrId], references: [id])

//   @@unique([tourPlanId, mrId])
//   @@index([mrId, status])
// }

// enum TourPlanStatus {
//   DRAFT
//   PUBLISHED   // emails sent, MRs must respond
//   CANCELLED
// }

// enum TourPlanRSVP {
//   PENDING
//   ACCEPTED
//   REJECTED
// }



// # --- Requests ---
// enum RequestType { LEAVE APPOINTMENT_DOCTOR APPOINTMENT_CHEMIST STOCK_ALERT ACTIVITY }
// enum RequestStatus { PENDING APPROVED REJECTED CANCELLED }
// enum RequestPriority { LOW NORMAL HIGH }

// type RequestAction {
//   id: Int!
//   action: String!
//   note: String
//   actorId: Int!
//   createdAt: String!
// }

// type Request {
//   id: Int!
//   type: RequestType!
//   status: RequestStatus!
//   priority: RequestPriority
//   title: String!
//   details: JSON
//   doctorCompanyId: Int
//   chemistCompanyId: Int
//   productId: Int
//   startAt: String
//   endAt: String
//   abmRequired: Boolean
//   createdAt: String!
//   updatedAt: String!
//   decidedAt: String
//   decisionNote: String
//   actions: [RequestAction!]!
// }

// type PagedRequests {
//   code: Int!
//   success: Boolean!
//   message: String!
//   data: [Request!]!
//   page: Int!
//   limit: Int!
//   total: Int!
//   lastPage: Int!
// }

// input CreateRequestInput {
//   type: RequestType!
//   title: String!
//   priority: RequestPriority
//   details: JSON
//   doctorCompanyId: Int
//   chemistCompanyId: Int
//   productId: Int
//   startAt: String
//   endAt: String
//   abmRequired: Boolean
// }

// type BasicResponse {
//   code: Int!
//   success: Boolean!
//   message: String!
// }

// extend type Query {
//   getRequests(page: Int, limit: Int, status: RequestStatus, type: RequestType): PagedRequests!
//   getRequestById(id: Int!): Request
// }

// extend type Mutation {
//   createRequest(input: CreateRequestInput!): BasicResponse!        # MR
//   approveRequest(id: Int!, note: String): BasicResponse!           # ABM
//   rejectRequest(id: Int!, note: String): BasicResponse!            # ABM
//   cancelRequest(id: Int!): BasicResponse!                          # MR
// }

// # --- Tour Plans ---
// enum TourPlanStatus { DRAFT PUBLISHED CANCELLED }
// enum TourPlanRSVP { PENDING ACCEPTED REJECTED }

// type TourPlanParticipant {
//   mrId: Int!
//   status: TourPlanRSVP!
//   respondedAt: String
//   comment: String
// }

// type TourPlan {
//   id: Int!
//   title: String!
//   area: String
//   description: String
//   startDate: String!
//   endDate: String!
//   status: TourPlanStatus!
//   itinerary: JSON
//   participants: [TourPlanParticipant!]!
// }

// type PagedTourPlans {
//   code: Int!
//   success: Boolean!
//   message: String!
//   data: [TourPlan!]!
//   page: Int!
//   limit: Int!
//   total: Int!
//   lastPage: Int!
// }

// input CreateTourPlanInput {
//   title: String!
//   area: String
//   description: String
//   startDate: String!
//   endDate: String!
//   itinerary: JSON
//   mrIds: [Int!]!   # invite these MRs
// }

// extend type Query {
//   myTourPlans(page: Int, limit: Int, status: TourPlanStatus): PagedTourPlans!   # MR view
//   tourPlansManaged(page: Int, limit: Int, status: TourPlanStatus): PagedTourPlans! # ABM view
// }

// extend type Mutation {
//   createTourPlan(input: CreateTourPlanInput!): BasicResponse!    # ABM
//   publishTourPlan(id: Int!): BasicResponse!                      # ABM (send mails, set status=PUBLISHED)
//   respondTourPlan(id: Int!, rsvp: TourPlanRSVP!, comment: String): BasicResponse!  # MR Accept/Reject
//   cancelTourPlan(id: Int!): BasicResponse!                       # ABM
// }


// // list requests (MR sees own; ABM sees their team)
// getRequests: async (_: any, args: { page?: number; limit?: number; status?: RequestStatus; type?: RequestType }, ctx: Context) => {
//   if (!ctx || ctx.authError) return { code: 400, success: false, message: ctx?.authError || "Authorization Error", data: [], page: 1, limit: 10, total: 0, lastPage: 0 };

//   const companyId = ctx.user?.companyId;
//   const userId = ctx.user?.id;
//   const role = ctx.user?.role; // MR / ABM / ADMIN

//   const page = args.page && args.page > 0 ? args.page : 1;
//   const limit = args.limit && args.limit > 0 ? Math.min(args.limit, 100) : 10;

//   const whereBase: any = { companyId };
//   if (args.status) whereBase.status = args.status;
//   if (args.type) whereBase.type = args.type;

//   // role-based visibility
//   const where = (role === "ABM")
//     ? { ...whereBase, abmId: userId }          // ABM sees requests from their team
//     : (role === "MR")
//       ? { ...whereBase, mrId: userId }         // MR sees own
//       : whereBase;                             // ADMIN sees all in company

//   const total = await prisma.request.count({ where });
//   const lastPage = Math.max(1, Math.ceil(total / limit));
//   const rows = await prisma.request.findMany({
//     where, orderBy: { id: "desc" }, skip: (page - 1) * limit, take: limit,
//     include: { actions: true }
//   });

//   return { code: 200, success: true, message: "Requests fetched", data: rows, page, limit, total, lastPage };
// },

// createRequest: async (_: any, { input }: { input: CreateRequestInput }, ctx: Context) => {
//   if (!ctx || ctx.authError) return { code: 400, success: false, message: ctx?.authError || "Authorization Error" };
//   const { companyId, id: mrId, abmId } = ctx.user!;
//   const req = await prisma.request.create({
//     data: {
//       companyId, mrId, abmId,
//       type: input.type, title: input.title, priority: input.priority ?? "NORMAL",
//       details: input.details, doctorCompanyId: input.doctorCompanyId, chemistCompanyId: input.chemistCompanyId,
//       productId: input.productId, startAt: input.startAt ? new Date(input.startAt) : undefined,
//       endAt: input.endAt ? new Date(input.endAt) : undefined, abmRequired: !!input.abmRequired,
//       actions: { create: { actorId: mrId, action: "CREATED" } }
//     }
//   });
//   return { code: 200, success: true, message: `Request #${req.id} created` };
// },

// approveRequest: async (_: any, { id, note }: { id: number; note?: string }, ctx: Context) => {
//   if (!ctx || ctx.authError) return { code: 400, success: false, message: ctx?.authError || "Authorization Error" };
//   const { id: abmId, companyId, role } = ctx.user!;
//   if (role !== "ABM" && role !== "ADMIN") return { code: 403, success: false, message: "Only ABM/Admin can approve" };

//   await prisma.$transaction(async (tx) => {
//     await tx.request.update({
//       where: { id },
//       data: { status: "APPROVED", decidedAt: new Date(), decisionNote: note },
//     });
//     await tx.requestAction.create({ data: { requestId: id, actorId: abmId, action: "APPROVED", note } });
//   });
//   // TODO: send email/notification to MR
//   return { code: 200, success: true, message: "Approved" };
// },

// rejectRequest: async (_: any, { id, note }: { id: number; note?: string }, ctx: Context) => {
//   // mirror approveRequest, set status=REJECTED; create RequestAction; notify MR
//   return { code: 200, success: true, message: "Rejected" };
// },

// cancelRequest: async (_: any, { id }: { id: number }, ctx: Context) => {
//   // MR can cancel pending requests
//   return { code: 200, success: true, message: "Cancelled" };
// },


// createTourPlan: async (_: any, { input }: { input: CreateTourPlanInput }, ctx: Context) => {
//   if (!ctx || ctx.authError) return { code: 400, success: false, message: ctx?.authError || "Authorization Error" };
//   if (ctx.user?.role !== "ABM" && ctx.user?.role !== "ADMIN") return { code: 403, success: false, message: "Only ABM/Admin" };

//   await prisma.tourPlan.create({
//     data: {
//       companyId: ctx.user!.companyId,
//       abmId: ctx.user!.id,
//       title: input.title,
//       area: input.area,
//       description: input.description,
//       startDate: new Date(input.startDate),
//       endDate: new Date(input.endDate),
//       itinerary: input.itinerary,
//       participants: { createMany: { data: input.mrIds.map(mrId => ({ mrId })) } }
//     }
//   });
//   return { code: 200, success: true, message: "Tour plan created (draft)" };
// },

// publishTourPlan: async (_: any, { id }: { id: number }, ctx: Context) => {
//   // set status=PUBLISHED, publishedAt=now, send emails to all participants, set emailSentAt
//   return { code: 200, success: true, message: "Tour plan published & emails sent" };
// },

// respondTourPlan: async (_: any, { id, rsvp, comment }: { id: number; rsvp: "ACCEPTED" | "REJECTED"; comment?: string }, ctx: Context) => {
//   // MR sets participant.status, respondedAt
//   return { code: 200, success: true, message: `RSVP ${rsvp}` };
// },

// myTourPlans: async (_: any, args: { page?: number; limit?: number; status?: string }, ctx: Context) => {
//   // paginate TourPlanParticipant by mrId, join TourPlan
//   return { code: 200, success: true, message: "OK", data: [], page: 1, limit: 10, total: 0, lastPage: 0 };
// },


// {
//   "query": "mutation CreateReq($input: CreateRequestInput!) { createRequest(input: $input) { code success message } }",
//   "variables": {
//     "input": {
//       "type": "LEAVE",
//       "title": "Annual leave",
//       "details": { "reason": "family event" },
//       "startAt": "2025-11-20T00:00:00.000Z",
//       "endAt": "2025-11-22T23:59:59.000Z"
//     }
//   }
// }
// {
//   "query": "mutation CreateReq($input: CreateRequestInput!) { createRequest(input: $input) { code success message } }",
//   "variables": {
//     "input": {
//       "type": "APPOINTMENT_DOCTOR",
//       "title": "Fixed appointment with Dr. Sharma",
//       "doctorCompanyId": 123,
//       "startAt": "2025-11-25T10:30:00.000Z",
//       "abmRequired": true,
//       "details": { "agenda": "New product intro" }
//     }
//   }
// }
// {
//   "query": "mutation Approve($id: Int!, $note: String) { approveRequest(id: $id, note: $note) { code success message } }",
//   "variables": { "id": 45, "note": "See you there" }
// }
// {
//   "query": "mutation CreateAndPublish($input: CreateTourPlanInput!, $id: Int!) { createTourPlan(input: $input) { code success message } publishTourPlan(id: $id) { code success message } }",
//   "variables": {
//     "input": {
//       "title": "North Zone Coverage",
//       "area": "Lucknow HQ",
//       "description": "Doctor focus + chemist followups",
//       "startDate": "2025-12-01T00:00:00.000Z",
//       "endDate": "2025-12-07T23:59:59.000Z",
//       "mrIds": [12, 34],
//       "itinerary": [
//         { "date": "2025-12-01", "hq": "Alambagh", "doctors": [101,102], "chemists": [201], "notes": "Launch briefing" }
//       ]
//     },
//     "id": 1
//   }
// }
// {
//   "query": "mutation RSVP($id: Int!, $rsvp: TourPlanRSVP!, $comment: String) { respondTourPlan(id: $id, rsvp: $rsvp, comment: $comment) { code success message } }",
//   "variables": { "id": 1, "rsvp": "ACCEPTED", "comment": "All good" }
// }
