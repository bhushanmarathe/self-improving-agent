import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { env } from "./config/env.js";

import {
  bookAppointment,
  getAppointment,
  rescheduleAppointment,
  searchAvailableSlots,
} from "./services/appointmentService.js";

import {
  createConversation,
  getConversation,
} from "./agent/conversationStore.js";

import { runAgent } from "./agent/agent.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// --------------------------------------------------
// Helper: Handle Agent Errors
// --------------------------------------------------

function handleAgentError(error: unknown, res: express.Response) {
  console.error("Agent error:", error);

  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    error.status === 429
  ) {
    return res.status(429).json({
      error:
        "The AI service has reached its daily token limit. Please try again later.",
    });
  }

  return res.status(500).json({
    error:
      error instanceof Error ? error.message : "Unable to process the message.",
  });
}

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "appointment-agent-api",
  });
});

// --------------------------------------------------
// Get Appointment
// --------------------------------------------------

app.get("/api/appointments/:id", async (req, res) => {
  try {
    const appointment = await getAppointment(req.params.id);

    res.json(appointment);
  } catch (error) {
    res.status(404).json({
      error: error instanceof Error ? error.message : "Appointment not found.",
    });
  }
});

// --------------------------------------------------
// Reschedule Appointment
// --------------------------------------------------

app.patch("/api/appointments/:id", async (req, res) => {
  try {
    const appointment = await rescheduleAppointment({
      appointmentId: req.params.id,
      newSlotId: req.body.newSlotId,
    });

    res.json(appointment);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to reschedule appointment.",
    });
  }
});

// --------------------------------------------------
// Get Available Slots
// --------------------------------------------------

app.get("/api/slots", async (_req, res) => {
  try {
    const slots = await searchAvailableSlots({});

    res.json(slots);
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to retrieve available slots.",
    });
  }
});

// --------------------------------------------------
// Book Appointment
// --------------------------------------------------

app.post("/api/appointments", async (req, res) => {
  try {
    const appointment = await bookAppointment(req.body);

    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Unable to book appointment.",
    });
  }
});

// --------------------------------------------------
// Create Conversation
// --------------------------------------------------

app.post("/api/conversations", (req, res) => {
  const { patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({
      error: "patientId is required.",
    });
  }

  const conversation = createConversation(patientId);

  return res.status(201).json({
    conversationId: conversation.id,
  });
});

// --------------------------------------------------
// Send Message to Existing Conversation
// --------------------------------------------------

app.post("/api/conversations/:id/messages", async (req, res) => {
  try {
    const conversation = getConversation(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        error: "Conversation not found.",
      });
    }

    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "message is required.",
      });
    }

    const response = await runAgent(conversation, message);

    return res.json({
      conversationId: conversation.id,
      response,
    });
  } catch (error) {
    return handleAgentError(error, res);
  }
});

// --------------------------------------------------
// Chat Endpoint for React Frontend
// --------------------------------------------------

app.post("/api/chat", async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "message is required.",
      });
    }

    let conversation;

    if (conversationId) {
      conversation = getConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found.",
        });
      }
    } else {
      conversation = createConversation("patient-1");
    }

    const response = await runAgent(conversation, message);

    return res.json({
      conversationId: conversation.id,
      response,
    });
  } catch (error) {
    return handleAgentError(error, res);
  }
});

// --------------------------------------------------
// Start Server
// --------------------------------------------------

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
