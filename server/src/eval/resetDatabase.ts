import prisma from "../lib/prisma.js";

async function main() {
  await prisma.appointment.deleteMany();

  await prisma.appointmentSlot.updateMany({
    data: {
      isAvailable: true,
    },
  });

  console.log("Evaluation database reset successfully.");
}

main()
  .catch((error) => {
    console.error("Failed to reset evaluation database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
