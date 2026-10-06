//import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { appointmentRepository } from "../repositories/appointmentRepository.js";

const CLINIC_TIMEZONE = "Asia/Kolkata";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIMEZONE,
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export async function searchAvailableSlots({
  doctorId,
  specialty,
  date,
  startTime,
  timePreference,
}: {
  doctorId?: string;
  specialty?: string;
  date?: string;
  startTime?: string;
  timePreference?: "morning" | "afternoon" | "evening";
}) {
  const slots = await appointmentRepository.getSlots();

  return slots
    .filter((slot: { isAvailable: any }) => slot.isAvailable)
    .filter((slot: { doctorId: string }) => {
      if (doctorId && slot.doctorId !== doctorId) {
        return false;
      }

      return true;
    })
    .filter((slot: { doctor: { specialty: string } }) => {
      if (!specialty) {
        return true;
      }

      return slot.doctor.specialty.toLowerCase() === specialty.toLowerCase();
    })
    .filter((slot: { startTime: Date }) => {
      if (!date) {
        return true;
      }

      return formatDate(slot.startTime) === date;
    })
    .filter((slot: { startTime: Date }) => {
      if (!startTime) {
        return true;
      }

      return formatTime(slot.startTime) === startTime;
    })
    .filter((slot: { startTime: Date }) => {
      if (!timePreference) {
        return true;
      }

      const hour = Number(formatTime(slot.startTime).split(":")[0]);

      if (timePreference === "morning") {
        return hour >= 6 && hour < 12;
      }

      if (timePreference === "afternoon") {
        return hour >= 12 && hour < 17;
      }

      if (timePreference === "evening") {
        return hour >= 17 && hour < 22;
      }

      return true;
    })
    .map(
      (slot: {
        id: any;
        doctor: { name: any; specialty: any };
        startTime: Date;
        endTime: Date;
        timezone: any;
      }) => ({
        slotId: slot.id,
        doctor: slot.doctor.name,
        specialty: slot.doctor.specialty,
        date: formatDate(slot.startTime),
        startTime: formatTime(slot.startTime),
        endTime: formatTime(slot.endTime),
        timezone: slot.timezone,
      }),
    );
}

export async function bookAppointment(params: {
  patientId: string;
  slotId: string;
  reason?: string;
}) {
  const patient = await appointmentRepository.getPatientById(params.patientId);

  if (!patient) {
    throw new Error("Patient not found.");
  }

  const slot = await appointmentRepository.getSlotById(params.slotId);

  if (!slot) {
    throw new Error("Appointment slot not found.");
  }

  if (!slot.isAvailable) {
    throw new Error("This appointment slot is no longer available.");
  }

  const appointment = await appointmentRepository.saveAppointment({
    patientId: patient.id,
    doctorId: slot.doctorId,
    slotId: slot.id,
    reason: params.reason,
  });

  return {
    id: appointment.id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    slotId: appointment.slotId,
    reason: appointment.reason,
    status: appointment.status,
  };
}

export async function getAppointment(appointmentId: string) {
  const appointment =
    await appointmentRepository.getAppointmentById(appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found.");
  }

  return {
    id: appointment.id,
    patient: appointment.patient,
    doctor: appointment.doctor,
    slot: {
      id: appointment.slot.id,
      date: formatDate(appointment.slot.startTime),
      startTime: formatTime(appointment.slot.startTime),
      endTime: formatTime(appointment.slot.endTime),
      timezone: appointment.slot.timezone,
    },
    reason: appointment.reason,
    status: appointment.status,
  };
}

export async function getMyAppointments(patientId: string) {
  const patient = await appointmentRepository.getPatientById(patientId);

  if (!patient) {
    throw new Error("Patient not found.");
  }

  const appointments =
    await appointmentRepository.getAppointmentsByPatientId(patientId);

  return appointments.map(
    (appointment: {
      id: any;
      status: any;
      doctor: { name: any; specialty: any };
      slot: { startTime: Date; endTime: Date; timezone: any };
    }) => ({
      appointmentId: appointment.id,
      status: appointment.status,
      doctor: appointment.doctor.name,
      specialty: appointment.doctor.specialty,
      date: formatDate(appointment.slot.startTime),
      startTime: formatTime(appointment.slot.startTime),
      endTime: formatTime(appointment.slot.endTime),
      timezone: appointment.slot.timezone,
    }),
  );
}

export async function rescheduleAppointment(params: {
  appointmentId: string;
  newSlotId: string;
}) {
  return prisma.$transaction(
    async (tx: {
      appointment: {
        findUnique: (arg0: { where: { id: string } }) => any;
        update: (arg0: {
          where: { id: any };
          data: { slotId: any; doctorId: any };
          include: { patient: boolean; doctor: boolean; slot: boolean };
        }) => any;
      };
      appointmentSlot: {
        findUnique: (arg0: {
          where: { id: any } | { id: string };
          include?: { doctor: boolean };
        }) => any;
        update: (arg0: {
          where: { id: any } | { id: any };
          data: { isAvailable: boolean } | { isAvailable: boolean };
        }) => any;
      };
    }) => {
      const appointment = await tx.appointment.findUnique({
        where: {
          id: params.appointmentId,
        },
      });

      if (!appointment) {
        throw new Error("Appointment not found.");
      }

      if (appointment.status !== "BOOKED") {
        throw new Error("Only booked appointments can be rescheduled.");
      }

      const currentSlot = await tx.appointmentSlot.findUnique({
        where: {
          id: appointment.slotId,
        },
      });

      if (!currentSlot) {
        throw new Error("Current appointment slot not found.");
      }

      const newSlot = await tx.appointmentSlot.findUnique({
        where: {
          id: params.newSlotId,
        },
        include: {
          doctor: true,
        },
      });

      if (!newSlot) {
        throw new Error("New appointment slot not found.");
      }

      if (!newSlot.isAvailable) {
        throw new Error("The new appointment slot is not available.");
      }

      if (newSlot.id === currentSlot.id) {
        throw new Error("The new slot is the same as the current slot.");
      }

      await tx.appointmentSlot.update({
        where: {
          id: currentSlot.id,
        },
        data: {
          isAvailable: true,
        },
      });

      await tx.appointmentSlot.update({
        where: {
          id: newSlot.id,
        },
        data: {
          isAvailable: false,
        },
      });

      const updatedAppointment = await tx.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          slotId: newSlot.id,
          doctorId: newSlot.doctorId,
        },
        include: {
          patient: true,
          doctor: true,
          slot: true,
        },
      });

      return {
        id: updatedAppointment.id,
        patient: updatedAppointment.patient,
        doctor: updatedAppointment.doctor,
        slot: {
          id: updatedAppointment.slot.id,
          date: formatDate(updatedAppointment.slot.startTime),
          startTime: formatTime(updatedAppointment.slot.startTime),
          endTime: formatTime(updatedAppointment.slot.endTime),
          timezone: updatedAppointment.slot.timezone,
        },
        reason: updatedAppointment.reason,
        status: updatedAppointment.status,
      };
    },
  );
}

export async function cancelAppointment(appointmentId: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const appointment = await tx.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found.");
    }

    if (appointment.status === "CANCELLED") {
      throw new Error("Appointment is already cancelled.");
    }

    if (appointment.status === "COMPLETED") {
      throw new Error("Completed appointments cannot be cancelled.");
    }

    await tx.appointmentSlot.update({
      where: {
        id: appointment.slotId,
      },
      data: {
        isAvailable: true,
      },
    });

    const cancelledAppointment = await tx.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: "CANCELLED",
      },
      include: {
        patient: true,
        doctor: true,
        slot: true,
      },
    });

    return {
      id: cancelledAppointment.id,
      patient: cancelledAppointment.patient,
      doctor: cancelledAppointment.doctor,
      slot: {
        id: cancelledAppointment.slot.id,
        date: formatDate(cancelledAppointment.slot.startTime),
        startTime: formatTime(cancelledAppointment.slot.startTime),
        endTime: formatTime(cancelledAppointment.slot.endTime),
        timezone: cancelledAppointment.slot.timezone,
      },
      status: cancelledAppointment.status,
    };
  });
}
