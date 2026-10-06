import {
  bookAppointment,
  cancelAppointment,
  getAppointment,
  getMyAppointments,
  rescheduleAppointment,
  searchAvailableSlots,
} from "../services/appointmentService.js";

interface ToolContext {
  patientId: string;
}

export async function executeTool(
  name: string,
  rawArguments: string,
  context: ToolContext,
) {
  const args = JSON.parse(rawArguments);

  switch (name) {
    case "search_available_slots":
      return searchAvailableSlots({
        doctorId: args.doctorId,
        specialty: args.specialty,
        date: args.date,
        startTime: args.startTime,
        timePreference: args.timePreference,
      });

    case "book_appointment":
      return bookAppointment({
        patientId: context.patientId,
        slotId: args.slotId,
        reason: args.reason,
      });

    case "get_appointment":
      return getAppointment(args.appointmentId);

    case "get_my_appointments":
      return getMyAppointments(context.patientId);

    case "reschedule_appointment":
      return rescheduleAppointment({
        appointmentId: args.appointmentId,
        newSlotId: args.newSlotId,
      });

    case "cancel_appointment":
      return cancelAppointment(args.appointmentId);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
