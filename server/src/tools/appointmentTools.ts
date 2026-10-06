import { z } from "zod";

import {
  searchAvailableSlots,
  bookAppointment,
  getAppointment,
  rescheduleAppointment,
  cancelAppointment,
} from "../services/appointmentService.js";

export const appointmentTools = {
  searchAvailableSlots: {
    description:
      "Find available appointment slots based on doctor or specialty.",

    schema: z.object({
      doctorId: z.string().optional(),
      specialty: z.string().optional(),
    }),

    execute: searchAvailableSlots,
  },

  bookAppointment: {
    description: "Book an available appointment slot for a patient.",

    schema: z.object({
      patientId: z.string(),
      slotId: z.string(),
      reason: z.string().optional(),
    }),

    execute: bookAppointment,
  },

  getAppointment: {
    description: "Retrieve the details of an existing appointment.",

    schema: z.object({
      appointmentId: z.string(),
    }),

    execute: ({ appointmentId }: { appointmentId: string }) =>
      getAppointment(appointmentId),
  },

  rescheduleAppointment: {
    description:
      "Move an existing booked appointment to another available slot.",

    schema: z.object({
      appointmentId: z.string(),
      newSlotId: z.string(),
    }),

    execute: rescheduleAppointment,
  },

  cancelAppointment: {
    description: "Cancel an existing booked appointment.",

    schema: z.object({
      appointmentId: z.string(),
    }),

    execute: ({ appointmentId }: { appointmentId: string }) =>
      cancelAppointment(appointmentId),
  },
};
