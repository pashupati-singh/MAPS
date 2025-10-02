import { Context } from "../../context";
import { getLatLongFromAddress } from "../../utils/latlong";
import { createResponse } from "../../utils/response";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const DoctorResolvers = {
  Query: {
    doctors: async (_: any,args: { page?: number; limit?: number },context: Context) => {
      try {
        if(!context || context.authError) return createResponse(401, false, "Unauthorized");
        if(!context.user?.companyId) return createResponse(401, false, "Company not found");
        const page = args.page && args.page > 0 ? args.page : 1;
        const limit = args.limit && args.limit > 0 ? args.limit : 10;

        const totalUsers = await prisma.doctorCompany.count({ where: { companyId : context.user?.companyId } });

        const lastPage = Math.ceil(totalUsers / limit);
        const doctors = await prisma.doctorCompany.findMany({
          where : { companyId : context.user?.companyId},
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { id: "asc" } ,
          include: {
            doctor : { include: { address: true } ,  },
          },
        });
        return { code: 200, success: true, message: "Doctors fetched successfully",doctors , lastPage};
      } catch (err: any) {
        return createResponse(500, false, err.message, { doctors: [] });
      }
    },

    doctor: async (_: any, { id }: any) => {
      try {
        const doctor = await prisma.doctor.findUnique({
          where: { id: Number(id) },
          include: {
            address: true,
            companies: { include: { company: true } },
            chemists: { include: { chemist: true } },
            products: true,
          },
        });

        if (!doctor) {
          return createResponse(404, false, "Doctor not found", { doctor: null });
        }

        return createResponse(200, true, "Doctor fetched successfully", doctor);
      } catch (err: any) {
        return createResponse(500, false, err.message, { doctor: null });
      }
    },
  },

  Mutation: {
createDoctor: async (_: any, { input }: any, context: Context) => {
  try {
    if (!context || context.authError) {
      return { code: 400, success: false, message: context.authError || "Authorization Error", doctor: null };
    }
    const companyId = context.user?.companyId;
    if (!companyId) {
      return { code: 400, success: false, message: "Company authorization required", doctor: null };
    }

    let addressId: number | null = null;
    if (input.address) {
      const fullAddress = [
        input.address.address,
        input.address.city,
        input.address.state,
        input.address.pinCode,
        input.address.country,
        input.address.landmark,
      ].filter(Boolean).join(", ");

      let latitude: number | null =
        input.address.latitude != null ? Number(input.address.latitude) : null;
      let longitude: number | null =
        input.address.longitude != null ? Number(input.address.longitude) : null;

      // try {
      //   const coords = await getLatLongFromAddress(fullAddress);
      //   latitude = (coords?.latitude != null ? Number(coords.latitude) : latitude);
      //   longitude = (coords?.longitude != null ? Number(coords.longitude) : longitude);
      // } catch (error: any) {
      //   return {
      //     code: 400,
      //     success: false,
      //     message: `Failed to fetch coordinates: ${error.message}`,
      //     doctor: null,
      //   };
      // }

      const createdAddress = await prisma.address.create({
        data: {
          address:  input.address.address  ?? "",
          city:     input.address.city     ?? "",
          state:    input.address.state    ?? "",
          pinCode:  input.address.pinCode  ?? "",
          country:  input.address.country  ?? "",
          landmark: input.address.landmark ?? null,
          latitude: latitude  ?? undefined,   
          longitude: longitude ?? undefined,  
        },
      });

      addressId = createdAddress.id;
    }

    const doctor = await prisma.doctor.create({
      data: {
        name:   input.name,
        titles: input.titles ?? [],                 
        status: input.status || "ACTIVE",           
        addressId,
        companies: {
          create: {
            companyId,
            email:         input.email        ?? null,
            phone:         input.phone        ?? null,
            dob:           input.dob          ?? null,   
            anniversary:   input.anniversary  ?? null,
            approxTarget:  input.approxTarget ?? null,
          },
        },
      },
      include: {
        address: true,
        companies: { include: { company: true } },  
      },
    });

    return {
      code: 201,
      success: true,
      message: "Doctor created successfully",
      doctor,
    };
  } catch (err: any) {
    return { code: 500, success: false, message: err.message, doctor: null };
  }
},
updateDoctor: async (_: any, { input }: any, context: Context) => {
  try {
    if(!context || context.authError) return createResponse(401, false, "Unauthorized");
    if(!context.user?.companyId) return createResponse(401, false, "Company not found");
    const doctor = await prisma.doctor.findUnique({
      where: { id: Number(input.doctorId) },
    });
    if (!doctor) return createResponse(404, false, "Doctor not found");

    let addressId = doctor.addressId;
    if (input.address) {
      const fullAddress = [
        input.address.address,
        input.address.city,
        input.address.state,
        input.address.pinCode,
        input.address.country,
        input.address.landmark,
      ].filter(Boolean).join(", ");

      let latitude: number | null = input.address.latitude ?? null;
      let longitude: number | null = input.address.longitude ?? null;

      // try {
      //   const coords = await getLatLongFromAddress(fullAddress);
      //   latitude = coords.latitude || latitude;
      //   longitude = coords.longitude || longitude;
      // } catch (error: any) {
      //   return createResponse(
      //     400,
      //     false,
      //     `Failed to fetch coordinates: ${error.message}`
      //   );
      // }

      if (addressId) {
        await prisma.address.update({
          where: { id: addressId },
          data: { ...input.address, latitude, longitude },
        });
      } else {
        const newAddress = await prisma.address.create({
          data: { ...input.address, latitude, longitude },
        });
        addressId = newAddress.id;
      }
    }

    await prisma.doctor.update({
      where: { id: Number(input.doctorId) },
      data: {
        name: input.name ?? doctor.name,
        titles: input.titles ?? doctor.titles,
        status: input.status ?? doctor.status,
        addressId,
      },
    });

    const companyId = context?.user?.companyId;
    if (companyId) {
      await prisma.doctorCompany.updateMany({
        where: { doctorId: Number(input.doctorId), companyId },
        data: {
          email: input.email ?? undefined,
          phone: input.phone ?? undefined,
          dob: input.dob ?? undefined,
          anniversary: input.anniversary ?? undefined,
          approxTarget: input.approxTarget ?? undefined,
        },
      });
    }
    const doctors = await prisma.doctor.findUnique({
      where: { id: Number(input.doctorId) },
      include: {
        address: true,
        companies: true,
      },
    });

    return {
  code: 200,
  success: true,
  message: "Doctor updated successfully",
  doctor: doctors,
};
  } catch (err: any) {
    return createResponse(500, false, err.message);
  }
},


    deleteDoctor: async (_: any, { id }: any) => {
      try {
        const doctor = await prisma.doctor.findUnique({ where: { id: Number(id) } });
        if (!doctor) {
          return createResponse(404, false, "Doctor not found", { doctor: null });
        }

        await prisma.doctorCompany.deleteMany({ where: { doctorId: doctor.id } });
        await prisma.doctorChemist.deleteMany({ where: { doctorId: doctor.id } });

        const deletedDoctor = await prisma.doctor.delete({
          where: { id: Number(id) },
          include: { address: true },
        });

        return createResponse(200, true, "Doctor deleted successfully", {
          doctor: deletedDoctor,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message, { doctor: null });
      }
    },

    updateDoctorCompany: async (_: any, { input }: any) => {
      try {
        const { doctorId, companyId, email, phone, dob, anniversary, approxTarget } = input;

        const doctorCompany = await prisma.doctorCompany.findFirst({
          where: { doctorId, companyId },
        });
        if (!doctorCompany) {
          return createResponse(404, false, "DoctorCompany link not found");
        }

        const updatedDoctorCompany = await prisma.doctorCompany.update({
          where: { id: doctorCompany.id },
          data: {
            email: email ?? doctorCompany.email,
            phone: phone ?? doctorCompany.phone,
            dob: input.dob || null,
            anniversary: input.anniversary || null,
            approxTarget: approxTarget ?? doctorCompany.approxTarget,
          },
        });

        return createResponse(200, true, "DoctorCompany updated successfully", {
          doctorCompany: updatedDoctorCompany,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    assignDoctorToCompany: async (_: any, { input }: any) => {
      try {
        const { doctorId, companyId, email, phone, dob, anniversary, approxTarget } = input;

        const existingLink = await prisma.doctorCompany.findFirst({
          where: { doctorId, companyId },
        });
        if (existingLink) {
          return createResponse(400, false, "Doctor is already assigned to this company");
        }

        const doctorCompany = await prisma.doctorCompany.create({
          data: {
            doctorId,
            companyId,
            email,
            phone,
            dob: input.dob || null,
            anniversary: input.anniversary || null,
            approxTarget,
          },
        });

        return createResponse(201, true, "Doctor assigned to company successfully", {
          doctorCompany,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    unassignDoctorFromCompany: async (_: any, { input }: any) => {
      try {
        const { doctorId, companyId } = input;

        const existingLink = await prisma.doctorCompany.findFirst({
          where: { doctorId, companyId },
        });
        if (!existingLink) {
          return createResponse(404, false, "Doctor is not assigned to this company");
        }

        await prisma.doctorCompany.delete({ where: { id: existingLink.id } });

        return createResponse(200, true, "Doctor unassigned from company successfully");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    assignDoctorToChemists: async (_: any, { input }: any , context : Context) => {
      try {
        if(!context.company || context.authError) return createResponse(401, false, "Unauthorized");
        const {id} = context.company
        const { doctorId, chemistIds } = input;
        const doctorChemists: any[] = [];

        for (const chemistId of chemistIds) {
          const existingLink = await prisma.doctorChemist.findFirst({
            where: { doctorId, chemistId , companyId : id},
          });
          if (!existingLink) {
            const link = await prisma.doctorChemist.create({
              data: { doctorId, chemistId , companyId : id },
            });
            doctorChemists.push(link);
          }
        }

        return createResponse(201, true, "Doctor assigned to chemists successfully", {
          doctorChemists,
        });
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },

    unassignDoctorFromChemists: async (_: any, { input }: any , context : Context) => {
      try {
        if(!context.company || context.authError) return createResponse(401, false, "Unauthorized");
        const {id} = context.company
        const { doctorId, chemistIds } = input;

        await prisma.doctorChemist.deleteMany({
          where: { doctorId, chemistId: { in: chemistIds } , companyId : id},
        });

        return createResponse(200, true, "Doctor unassigned from chemists successfully");
      } catch (err: any) {
        return createResponse(500, false, err.message);
      }
    },
  },
};
