import {
  bookAppointment,
  cancelAppointment,
  getAppointment,
  rescheduleAppointment,
  searchAvailableSlots,
} from "../services/appointmentService.js";

export const tools = [
  {
    type: "function",
    function: {
      name: "search_available_slots",
      description:
        "Search for available appointment slots. Use this whenever the patient asks about appointment availability. Filter by specialty, doctor, date, and/or time preference when the patient provides those details. Never assume a slot is available.",
      parameters: {
        type: "object",
        properties: {
          doctorId: {
            type: "string",
            description:
              "Optional doctor ID if the patient specifically requests a doctor.",
          },

          specialty: {
            type: "string",
            description:
              "Optional medical specialty, such as Cardiology, Dermatology, or General Medicine.",
          },
          date: {
            type: "string",
            description:
              "Optional appointment date in YYYY-MM-DD format. Use this when the patient specifies a date such as tomorrow or October 6.",
          },
          startTime: {
            type: "string",
            description:
              "Optional exact appointment start time in 24-hour HH:mm format, for example 10:00 or 15:00.",
          },
          timePreference: {
            type: "string",
            enum: ["morning", "afternoon", "evening"],
            description:
              "Optional time-of-day preference when the patient specifies morning, afternoon, or evening.",
          },
        },
        required: [],
      },
    },
  },

  {
    type: "function" as const,
    function: {
      name: "book_appointment",
      description:
        "Book a specific appointment slot after the patient has explicitly selected that slot. Do not use this to choose a slot for the patient.",
      parameters: {
        type: "object",
        properties: {
          patientId: {
            type: "string",
            description: "Patient ID supplied by the application context.",
          },
          slotId: {
            type: "string",
            description: "The exact appointment slot selected by the patient.",
          },
          reason: {
            type: "string",
            description: "Optional reason for the appointment.",
          },
        },
        required: ["patientId", "slotId"],
        additionalProperties: false,
      },
    },
  },

  {
    type: "function" as const,
    function: {
      name: "get_appointment",
      description: "Retrieve details for an existing appointment.",
      parameters: {
        type: "object",
        properties: {
          appointmentId: {
            type: "string",
          },
        },
        required: ["appointmentId"],
        additionalProperties: false,
      },
    },
  },

  {
    type: "function",
    function: {
      name: "get_my_appointments",
      description:
        "Get the current patient's appointments. Use this when the patient wants to view, reschedule, or cancel an appointment but has not provided an appointment ID. The patient identity comes from the conversation context.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },

  {
    type: "function" as const,
    function: {
      name: "reschedule_appointment",
      description:
        "Reschedule an existing appointment to a specific available slot selected by the patient.",
      parameters: {
        type: "object",
        properties: {
          appointmentId: {
            type: "string",
          },
          newSlotId: {
            type: "string",
          },
        },
        required: ["appointmentId", "newSlotId"],
        additionalProperties: false,
      },
    },
  },

  {
    type: "function" as const,
    function: {
      name: "cancel_appointment",
      description:
        "Cancel an existing appointment after the patient has clearly confirmed that they want to cancel it.",
      parameters: {
        type: "object",
        properties: {
          appointmentId: {
            type: "string",
          },
        },
        required: ["appointmentId"],
        additionalProperties: false,
      },
    },
  },
];
