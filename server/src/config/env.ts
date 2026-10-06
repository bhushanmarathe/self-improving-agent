import dotenv from "dotenv";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is missing. Check server/.env");
}

export const env = {
  groqApiKey: process.env.GROQ_API_KEY,
  port: Number(process.env.PORT || 5000),
};
