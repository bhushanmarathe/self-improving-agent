import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function createISTDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+05:30`);
}

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.appointmentSlot.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();

  const patient = await prisma.patient.create({
    data: {
      id: "patient-1",
      name: "John Doe",
      email: "john@example.com",
      phone: "555-0100",
    },
  });

  const sarah = await prisma.doctor.create({
    data: {
      name: "Dr. Sarah Smith",
      specialty: "Cardiology",
    },
  });

  const michael = await prisma.doctor.create({
    data: {
      name: "Dr. Michael Brown",
      specialty: "Dermatology",
    },
  });

  const emily = await prisma.doctor.create({
    data: {
      name: "Dr. Emily Wilson",
      specialty: "General Medicine",
    },
  });

  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(tomorrow);

  const slots = [
    ["09:00", "09:30", sarah.id],
    ["10:00", "10:30", sarah.id],
    ["11:00", "11:30", sarah.id],
    ["14:00", "14:30", sarah.id],
    ["15:00", "15:30", sarah.id],

    ["09:00", "09:30", michael.id],
    ["10:00", "10:30", michael.id],
    ["14:00", "14:30", michael.id],
    ["16:00", "16:30", michael.id],

    ["09:00", "09:30", emily.id],
    ["11:00", "11:30", emily.id],
    ["13:00", "13:30", emily.id],
    ["15:00", "15:30", emily.id],
  ];

  await prisma.appointmentSlot.createMany({
    data: slots.map(([startTime, endTime, doctorId]) => ({
      doctorId,
      startTime: createISTDate(date, startTime),
      endTime: createISTDate(date, endTime),
      timezone: "Asia/Kolkata",
      isAvailable: true,
    })),
  });

  console.log("Database seeded successfully.");
  console.log(`Patient: ${patient.email}`);
  console.log(`Tomorrow: ${date}`);
}

main()
  .catch((error) => {
    console.error(error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
