import { prisma } from "@core/lib";
import { S3StorageService } from "@core/services";
import { prependS3EnvPrefix } from "@core/utils";
import { randomUUID } from "crypto";
import path from "path";
import { promises as fs } from "fs";
import axios from "axios";
import { createWorker } from "tesseract.js";

import { aiTools } from "./tools";
import { reminderService } from "../reminders/services/ReminderService";
import { assignmentService } from "../assignments/services/AssignmentService";

export interface AiContext {
  route: string;
  visibleData?: any;
  screenTitle?: string;
  userId?: number;
  userRole?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | any[];
  tool_call_id?: string;
  name?: string;
}

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
const SITE_NAME = "InmoHub";

const dispatchTool = async (toolCall: any, context: AiContext) => {
  const { name, arguments: argsString } = toolCall.function;
  const args = JSON.parse(argsString);

  console.log(`🛠️ Executing tool: ${name}`, args);

  try {
    switch (name) {
      case "search_agents": {
        const agents = await prisma.user.findMany({
          where: {
            OR: [
              { firstName: { contains: args.name, mode: "insensitive" } },
              { lastName: { contains: args.name, mode: "insensitive" } },
            ],
            roles: { some: { role: { name: "agent" } } }
          },
          select: { id: true, firstName: true, lastName: true, email: true }
        });
        return JSON.stringify(agents);
      }

      case "create_reminder": {
        if (!context.userId) return "Error: User ID required.";
        const result = await reminderService.createReminder(
          {
            title: args.title,
            note: args.note,
            responsibleId: args.responsibleId,
            scheduledAt: args.scheduledAt,
            buildingId: args.buildingId,
            propertyId: args.propertyId,
            recurrence: { type: "once" }
          },
          context.userId
        );
        return JSON.stringify({ success: true, reminderId: result.id });
      }

      case "assign_agent_to_building": {
        if (context.userRole !== "director") {
          return "Error: Solo los Directores pueden realizar asignaciones de edificios.";
        }
        const result = await assignmentService.createAssignment({
          userId: args.userId,
          buildingId: args.buildingId,
          startDate: args.startDate,
          endDate: args.endDate,
          type: "Following"
        });
        return JSON.stringify({ success: true, assignmentId: result.id });
      }

      default:
        return "Tool not implemented";
    }
  } catch (error: any) {
    console.error(`❌ Tool Execution Error (${name}):`, error.message);
    return `Error executing tool ${name}: ${error.message}`;
  }
};

export const chatWithAi = async (messages: any[], context: AiContext, mode: 'screen' | 'rag' = 'screen') => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is not set. AI features may not work.");
    throw new Error("AI service not configured.");
  }

  const systemPrompt = `
You are the "InmoHub Knowledge Agent", a premium AI assistant for the InmoHub CRM (Real Estate Management System). 
Your role is to guide users AND help them perform actions in the CRM.

USER INFO:
- Role: ${context.userRole || "Unknown"}
- User ID: ${context.userId || "Unknown"}

CORE MODULES:
1. **Edificios & Búsqueda** (/dashboard/search-properties): Manage building assignments.
2. **Propiedades** (/dashboard/porperties/[id]): Individual flat details.
3. **Gestión de Personas** (/dashboard/persons): Client database.
4. **Seguimientos & Tareas**: Reminders and visits.

INSTRUCTIONS:
1. **Actionable AI**: If a user wants to "assign", "schedule", "create a visit", or "search an agent", USE THE TOOLS provided. 
2. **Role Restrictions**: 
   - Directores: Can do anything, including assigning buildings to agents.
   - Agentes: Can schedule reminders/visits for themselves or others, but NOT assign buildings.
3. **Multistep**: If you don't know an ID (agent or building), use "search_agents" or check "Visible Data".
4. **Tone**: Executive, expert, and helpful. Support the user in Spanish.

CURRENT CONTEXT:
- Route: ${context.route}
- Screen Title: ${context.screenTitle || "Navigation"}
- Visible Data: ${JSON.stringify(context.visibleData || {}, null, 2)}
`;

  let currentMessages: any[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.0-flash-001",
        messages: currentMessages,
        tools: aiTools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": SITE_NAME,
        },
      }
    );

    let message = response.data.choices[0].message;

    if (message.tool_calls) {
      currentMessages.push(message);

      // Execute all tool calls
      for (const toolCall of message.tool_calls) {
        const result = await dispatchTool(toolCall, context);
        currentMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: result
        });
      }

      // Second call to get final response after tool results
      const secondResponse = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "google/gemini-2.0-flash-001",
          messages: currentMessages,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": SITE_URL,
            "X-Title": SITE_NAME,
          },
        }
      );
      return secondResponse.data.choices[0].message.content;
    }

    return message.content;
  } catch (error: any) {
    console.error("AI Service Error:", error.response?.data || error.message);
    throw error;
  }
};

export const extractTextFromImage = async (
  file: Express.Multer.File,
  userId: number
): Promise<{ text: string; imageUrl: string }> => {
  const s3 = S3StorageService.getInstance();
  const extension = path.extname(file.originalname).toLowerCase();
  const key = prependS3EnvPrefix(`ocr/${userId}/${Date.now()}-${randomUUID()}${extension}`);
  
  try {
    const fileBuffer = await fs.readFile(file.path);
    await s3.uploadFile({
      key,
      body: fileBuffer,
      contentType: file.mimetype,
      contentLength: file.size,
    });

    const imageUrl = s3.getPublicUrl(key);
    const worker = await createWorker(['spa', 'eng']);
    const { data: { text } } = await worker.recognize(file.path);
    await worker.terminate();
    
    await prisma.ocrHistory.create({
      data: {
        userId,
        imageUrl,
        extractedText: text,
      }
    });

    return { text, imageUrl };
  } catch (error: any) {
    console.error("❌ OCR Service Error:", error.message);
    throw error;
  } finally {
    try {
      if (file.path) await fs.unlink(file.path);
    } catch (e) {}
  }
};
