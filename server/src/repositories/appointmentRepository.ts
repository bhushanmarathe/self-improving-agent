import prisma from "../lib/prisma.js";

export const appointmentRepository = {
  getPatients() {
    return prisma.patient.findMany();
  },

  getPatientById(id: string) {
    return prisma.patient.findUnique({
      where: { id },
    });
  },

  getDoctors() {
    return prisma.doctor.findMany();
  },

  getDoctorById(id: string) {
    return prisma.doctor.findUnique({
      where: { id },
    });
  },

  getSlots() {
    return prisma.appointmentSlot.findMany({
      include: {
        doctor: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });
  },

  getSlotById(id: string) {
    return prisma.appointmentSlot.findUnique({
      where: { id },
      include: {
        doctor: true,
      },
    });
  },

  getAppointments() {
    return prisma.appointment.findMany({
      include: {
        patient: true,
        doctor: true,
        slot: true,
      },
    });
  },

  getAppointmentById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        slot: true,
      },
    });
  },

  getAppointmentsByPatientId(patientId: string) {
    return prisma.appointment.findMany({
      where: {
        patientId,
      },
      include: {
        doctor: true,
        slot: true,
      },
      orderBy: {
        slot: {
          startTime: "asc",
        },
      },
    });
  },

  saveAppointment(data: {
    patientId: string;
    doctorId: string;
    slotId: string;
    reason?: string;
  }) {
    return prisma.$transaction(
      async (tx: {
        appointmentSlot: {
          findUnique: (arg0: { where: { id: string } }) => any;
          update: (arg0: {
            where: { id: string };
            data: { isAvailable: boolean };
          }) => any;
        };
        appointment: {
          create: (arg0: {
            data: {
              patientId: string;
              doctorId: string;
              slotId: string;
              reason: string | undefined;
            };
          }) => any;
        };
      }) => {
        const slot = await tx.appointmentSlot.findUnique({
          where: {
            id: data.slotId,
          },
        });

        if (!slot) {
          throw new Error("Appointment slot not found.");
        }

        if (!slot.isAvailable) {
          throw new Error("This appointment slot is no longer available.");
        }

        await tx.appointmentSlot.update({
          where: {
            id: data.slotId,
          },
          data: {
            isAvailable: false,
          },
        });

        return tx.appointment.create({
          data: {
            patientId: data.patientId,
            doctorId: data.doctorId,
            slotId: data.slotId,
            reason: data.reason,
          },
        });
      },
    );
  },
};
