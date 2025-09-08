-- CreateEnum
CREATE TYPE "public"."CompanySize" AS ENUM ('STARTUP', 'SME', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "size" "public"."CompanySize",
    "website" TEXT,
    "logoUrl" TEXT,
    "status" "public"."CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" JSONB,
    "contacts" JSONB,
    "employees" INTEGER NOT NULL,
    "gstNumber" TEXT,
    "registrationNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "public"."Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_phone_key" ON "public"."Company"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Company_gstNumber_key" ON "public"."Company"("gstNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Company_registrationNo_key" ON "public"."Company"("registrationNo");
