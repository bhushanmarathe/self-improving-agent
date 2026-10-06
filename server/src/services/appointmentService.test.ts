import { afterAll, beforeEach, describe, expect, it } from "vitest";

import prisma from "../lib/prisma.js";

import {
  bookAppointment,
  cancelAppointment,
  getAppointment,
  rescheduleAppointment,
  searchAvailableSlots,
} from "./appointmentService.js";

const TEST_TIMEOUT = 30000;

describe("Appointment Service", () => {
  let patientId: string;
  let doctorId: string;
  let slot1Id: string;
  let slot2Id: string;

  beforeEach(async () => {
    // Delete appointments first because they reference slots.
    await prisma.appointment.deleteMany();

    // Then slots.
    await prisma.appointmentSlot.deleteMany();

    // Then doctors and patients.
    await prisma.doctor.deleteMany();
    await prisma.patient.deleteMany();

    const patient = await prisma.patient.create({
      data: {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-0100",
      },
    });

    patientId = patient.id;

    const doctor = await prisma.doctor.create({
      data: {
        name: "Dr. Sarah Smith",
        specialty: "Cardiology",
      },
    });

    doctorId = doctor.id;

    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const slot1Start = new Date(tomorrow);
    slot1Start.setHours(10, 0, 0, 0);

    const slot1End = new Date(tomorrow);
    slot1End.setHours(10, 30, 0, 0);

    const slot2Start = new Date(tomorrow);
    slot2Start.setHours(11, 0, 0, 0);

    const slot2End = new Date(tomorrow);
    slot2End.setHours(11, 30, 0, 0);

    const slot1 = await prisma.appointmentSlot.create({
      data: {
        doctorId,
        startTime: slot1Start,
        endTime: slot1End,
        timezone: "Asia/Kolkata",
        isAvailable: true,
      },
    });

    const slot2 = await prisma.appointmentSlot.create({
      data: {
        doctorId,
        startTime: slot2Start,
        endTime: slot2End,
        timezone: "Asia/Kolkata",
        isAvailable: true,
      },
    });

    slot1Id = slot1.id;
    slot2Id = slot2.id;
  });

  it("should find available slots", async () => {
    const result = await searchAvailableSlots({});

    expect(result.length).toBeGreaterThan(0);
  });

  it("should book an available slot", async () => {
    const result = await bookAppointment({
      patientId,
      slotId: slot1Id,
      reason: "Routine consultation",
    });

    expect(result.status).toBe("BOOKED");
    expect(result.slotId).toBe(slot1Id);

    const slot = await prisma.appointmentSlot.findUnique({
      where: {
        id: slot1Id,
      },
    });

    expect(slot?.isAvailable).toBe(false);
  });

  it("should not allow the same slot to be booked twice", async () => {
    await bookAppointment({
      patientId,
      slotId: slot1Id,
    });

    await expect(
      bookAppointment({
        patientId,
        slotId: slot1Id,
      }),
    ).rejects.toThrow("This appointment slot is no longer available.");
  });

  it("should retrieve an appointment", async () => {
    const appointment = await bookAppointment({
      patientId,
      slotId: slot1Id,
    });

    const result = await getAppointment(appointment.id);

    expect(result.id).toBe(appointment.id);
    expect(result.patient?.id).toBe(patientId);
    expect(result.doctor?.id).toBe(doctorId);
  });

  it("should reschedule an appointment", async () => {
    const appointment = await bookAppointment({
      patientId,
      slotId: slot1Id,
    });

    const result = await rescheduleAppointment({
      appointmentId: appointment.id,
      newSlotId: slot2Id,
    });

    expect(result.slot?.id).toBe(slot2Id);

    const oldSlot = await prisma.appointmentSlot.findUnique({
      where: {
        id: slot1Id,
      },
    });

    const newSlot = await prisma.appointmentSlot.findUnique({
      where: {
        id: slot2Id,
      },
    });

    expect(oldSlot?.isAvailable).toBe(true);
    expect(newSlot?.isAvailable).toBe(false);
  });

  it("should not reschedule to an unavailable slot", async () => {
    const appointment1 = await bookAppointment({
      patientId,
      slotId: slot1Id,
    });

    await bookAppointment({
      patientId,
      slotId: slot2Id,
    });

    await expect(
      rescheduleAppointment({
        appointmentId: appointment1.id,
        newSlotId: slot2Id,
      }),
    ).rejects.toThrow("The new appointment slot is not available.");
  });

  it("should cancel an appointment", async () => {
    const appointment = await bookAppointment({
      patientId,
      slotId: slot1Id,
    });

    const result = await cancelAppointment(appointment.id);

    expect(result.status).toBe("CANCELLED");

    const slot = await prisma.appointmentSlot.findUnique({
      where: {
        id: slot1Id,
      },
    });

    expect(slot?.isAvailable).toBe(true);
  });

  it("should not cancel an appointment twice", async () => {
    const appointment = await bookAppointment({
      patientId,
      slotId: slot1Id,
    });

    await cancelAppointment(appointment.id);

    await expect(cancelAppointment(appointment.id)).rejects.toThrow(
      "Appointment is already cancelled.",
    );
  });

  it("should expose appointment start time correctly", async () => {
    const result = await searchAvailableSlots({
      specialty: "Cardiology",
    });

    const slot = result.find(
      (slot: { slotId: string }) => slot.slotId === slot1Id,
    );

    expect(slot).toBeDefined();
    expect(slot?.startTime).toBe("10:00");
    expect(slot?.endTime).toBe("10:30");
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
});
