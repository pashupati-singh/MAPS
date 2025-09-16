/*
  Warnings:

  - Added the required column `password` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SubscriptionType" AS ENUM ('TRIAL', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('MR', 'ABM', 'ZM', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('CALL', 'APPOINTMENT', 'REMINDER');

-- CreateEnum
CREATE TYPE "public"."ExpenseCategory" AS ENUM ('TRAVEL', 'FOOD', 'ACCOMMODATION', 'SAMPLE', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "emailVerificationExpiry" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSubscribe" BOOLEAN DEFAULT false,
ADD COLUMN     "otpExpiry" TIMESTAMP(3),
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "phoneOtp" TEXT,
ADD COLUMN     "subscriptionEnd" TIMESTAMP(3),
ADD COLUMN     "subscriptionStart" TIMESTAMP(3),
ADD COLUMN     "subscriptionType" "public"."SubscriptionType";

-- CreateTable
CREATE TABLE "public"."PurchaseHistory" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "subscriptionType" "public"."SubscriptionType" NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "amountPaid" DOUBLE PRECISION,
    "paymentReference" TEXT,

    CONSTRAINT "PurchaseHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "phoneVerificationCode" TEXT,
    "phoneVerificationExpiry" TIMESTAMP(3),
    "emailVerificationToken" TEXT,
    "emailVerificationExpiry" TIMESTAMP(3),
    "mpin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "abmId" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Address" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "landmark" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Doctor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "titles" JSONB,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "addressId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chemist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "titles" JSONB,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "addressId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chemist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "salt" TEXT,
    "details" JSONB,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorCompany" (
    "id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "DoctorCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChemistCompany" (
    "id" SERIAL NOT NULL,
    "chemistId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,

    CONSTRAINT "ChemistCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorChemist" (
    "id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "chemistId" INTEGER NOT NULL,

    CONSTRAINT "DoctorChemist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorProduct" (
    "id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChemistProduct" (
    "id" SERIAL NOT NULL,
    "chemistId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChemistProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyPlan" (
    "id" SERIAL NOT NULL,
    "mrId" INTEGER NOT NULL,
    "abmId" INTEGER,
    "companyId" INTEGER NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "workTogether" BOOLEAN NOT NULL DEFAULT false,
    "isWorkTogetherConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "planDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyPlanDoctor" (
    "id" SERIAL NOT NULL,
    "dailyPlanId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,

    CONSTRAINT "DailyPlanDoctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyPlanChemist" (
    "id" SERIAL NOT NULL,
    "dailyPlanId" INTEGER NOT NULL,
    "chemistId" INTEGER NOT NULL,

    CONSTRAINT "DailyPlanChemist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyCallReport" (
    "id" SERIAL NOT NULL,
    "dailyPlanId" INTEGER NOT NULL,
    "mrId" INTEGER NOT NULL,
    "abmId" INTEGER,
    "doctorId" INTEGER,
    "chemistId" INTEGER,
    "typeOfReport" "public"."ReportType" NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "reportStartTime" TEXT NOT NULL,
    "reportEndTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "remarks" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "products" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCallReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Stock" (
    "id" SERIAL NOT NULL,
    "mrId" INTEGER NOT NULL,
    "doctorId" INTEGER,
    "chemistId" INTEGER,
    "productId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "dateOfUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOfReminder" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Target" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "quarter" INTEGER,
    "halfYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductTarget" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER,
    "productId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "quarter" INTEGER,
    "halfYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" SERIAL NOT NULL,
    "mrId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "doctorId" INTEGER,
    "chemistId" INTEGER,
    "productId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expense" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "category" "public"."ExpenseCategory" NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_email_key" ON "public"."Doctor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_phone_key" ON "public"."Doctor"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Chemist_email_key" ON "public"."Chemist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Chemist_phone_key" ON "public"."Chemist"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlan_planDate_key" ON "public"."DailyPlan"("planDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlanDoctor_dailyPlanId_doctorId_key" ON "public"."DailyPlanDoctor"("dailyPlanId", "doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPlanChemist_dailyPlanId_chemistId_key" ON "public"."DailyPlanChemist"("dailyPlanId", "chemistId");

-- CreateIndex
CREATE INDEX "Target_companyId_year_month_quarter_halfYear_idx" ON "public"."Target"("companyId", "year", "month", "quarter", "halfYear");

-- CreateIndex
CREATE INDEX "Target_userId_year_month_quarter_halfYear_idx" ON "public"."Target"("userId", "year", "month", "quarter", "halfYear");

-- CreateIndex
CREATE INDEX "ProductTarget_companyId_productId_year_month_quarter_halfYe_idx" ON "public"."ProductTarget"("companyId", "productId", "year", "month", "quarter", "halfYear");

-- CreateIndex
CREATE INDEX "ProductTarget_userId_productId_year_month_quarter_halfYear_idx" ON "public"."ProductTarget"("userId", "productId", "year", "month", "quarter", "halfYear");

-- AddForeignKey
ALTER TABLE "public"."PurchaseHistory" ADD CONSTRAINT "PurchaseHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_abmId_fkey" FOREIGN KEY ("abmId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Doctor" ADD CONSTRAINT "Doctor_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chemist" ADD CONSTRAINT "Chemist_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorCompany" ADD CONSTRAINT "DoctorCompany_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorCompany" ADD CONSTRAINT "DoctorCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChemistCompany" ADD CONSTRAINT "ChemistCompany_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "public"."Chemist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChemistCompany" ADD CONSTRAINT "ChemistCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorChemist" ADD CONSTRAINT "DoctorChemist_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorChemist" ADD CONSTRAINT "DoctorChemist_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "public"."Chemist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorProduct" ADD CONSTRAINT "DoctorProduct_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorProduct" ADD CONSTRAINT "DoctorProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChemistProduct" ADD CONSTRAINT "ChemistProduct_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "public"."Chemist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChemistProduct" ADD CONSTRAINT "ChemistProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyPlan" ADD CONSTRAINT "DailyPlan_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyPlan" ADD CONSTRAINT "DailyPlan_abmId_fkey" FOREIGN KEY ("abmId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyPlan" ADD CONSTRAINT "DailyPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyPlanDoctor" ADD CONSTRAINT "DailyPlanDoctor_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "public"."DailyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyPlanDoctor" ADD CONSTRAINT "DailyPlanDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyPlanChemist" ADD CONSTRAINT "DailyPlanChemist_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "public"."DailyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyPlanChemist" ADD CONSTRAINT "DailyPlanChemist_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "public"."Chemist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyCallReport" ADD CONSTRAINT "DailyCallReport_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "public"."DailyPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyCallReport" ADD CONSTRAINT "DailyCallReport_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyCallReport" ADD CONSTRAINT "DailyCallReport_abmId_fkey" FOREIGN KEY ("abmId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyCallReport" ADD CONSTRAINT "DailyCallReport_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyCallReport" ADD CONSTRAINT "DailyCallReport_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "public"."Chemist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stock" ADD CONSTRAINT "Stock_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stock" ADD CONSTRAINT "Stock_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stock" ADD CONSTRAINT "Stock_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "public"."Chemist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stock" ADD CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Target" ADD CONSTRAINT "Target_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Target" ADD CONSTRAINT "Target_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductTarget" ADD CONSTRAINT "ProductTarget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductTarget" ADD CONSTRAINT "ProductTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductTarget" ADD CONSTRAINT "ProductTarget_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES "public"."Chemist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
