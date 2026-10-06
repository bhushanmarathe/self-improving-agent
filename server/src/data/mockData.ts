import {
  Appointment,
  AppointmentSlot,
  Doctor,
  Patient,
} from "../types/appointment.js";

export const patients: Patient[] = [
  {
    id: "patient-1",
    name: "John Doe",
    email: "john@example.com",
    phone: "555-0100",
  },
];

export const doctors: Doctor[] = [
  {
    id: "doctor-1",
    name: "Dr. Sarah Smith",
    specialty: "Cardiology",
  },
  {
    id: "doctor-2",
    name: "Dr. Michael Brown",
    specialty: "Dermatology",
  },
  {
    id: "doctor-3",
    name: "Dr. Emily Wilson",
    specialty: "General Medicine",
  },
];

function getTomorrowDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  return date.toISOString().split("T")[0];
}

function createSlot(
  id: string,
  doctorId: string,
  hour: number,
): AppointmentSlot {
  const startTime = `${hour.toString().padStart(2, "0")}:00`;
  const endTime = `${hour.toString().padStart(2, "0")}:30`;

  return {
    id,
    doctorId,
    date: getTomorrowDate(),
    startTime,
    endTime,
    timezone: "Asia/Kolkata",
    isAvailable: true,
  };
}

export const slots: AppointmentSlot[] = [
  // Cardiology
  createSlot("slot-1", "doctor-1", 9),
  createSlot("slot-2", "doctor-1", 10),
  createSlot("slot-3", "doctor-1", 11),
  createSlot("slot-4", "doctor-1", 14),
  createSlot("slot-5", "doctor-1", 15),

  // Dermatology
  createSlot("slot-6", "doctor-2", 9),
  createSlot("slot-7", "doctor-2", 10),
  createSlot("slot-8", "doctor-2", 14),
  createSlot("slot-9", "doctor-2", 16),

  // General Medicine
  createSlot("slot-10", "doctor-3", 9),
  createSlot("slot-11", "doctor-3", 11),
  createSlot("slot-12", "doctor-3", 13),
  createSlot("slot-13", "doctor-3", 15),
];

export const appointments: Appointment[] = [];

export function resetMockData() {
  appointments.length = 0;

  slots.forEach((slot) => {
    slot.isAvailable = true;
  });
}
