export type AppointmentStatus = "BOOKED" | "CANCELLED" | "COMPLETED";

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timezone: string; // e.g. Asia/Kolkata
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  slotId: string;
  reason?: string;
  status: AppointmentStatus;
}
