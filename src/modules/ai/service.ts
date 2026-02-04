import { prisma } from "@core/lib";
import { S3StorageService } from "@core/services";
import { prependS3EnvPrefix } from "@core/utils";
import { randomUUID } from "crypto";
import path from "path";
import { promises as fs } from "fs";
import axios from "axios";

export interface AiContext {
  route: string;
  visibleData?: any;
  screenTitle?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | any[];
}

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
const SITE_NAME = "InmoHub";

export const chatWithAi = async (messages: ChatMessage[], context: AiContext) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is not set. AI features may not work.");
  }

  const systemPrompt = `
You are a helpful AI assistant for the InmoHub CRM.
Current Context:
Route: ${context.route}
Screen Title: ${context.screenTitle || "Unknown"}
Visible Data: ${JSON.stringify(context.visibleData || {}, null, 2)}

Use this context to answer the user's questions. 
`;

  const finalMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct:free",
        messages: finalMessages,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": SITE_NAME,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error("AI Service Error:", error.response?.data || error.message);
    throw error;
  }
};

export const extractTextFromImage = async (
  file: Express.Multer.File,
  userId: number
): Promise<{ text: string; imageUrl: string }> => {
  console.log("🚀 Starting OCR process for user:", userId);
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY is missing in process.env");
    throw new Error("OPENROUTER_API_KEY is not set.");
  }

  // 1. Upload to S3
  const s3 = S3StorageService.getInstance();
  const extension = path.extname(file.originalname).toLowerCase();
  const key = prependS3EnvPrefix(`ocr/${userId}/${Date.now()}-${randomUUID()}${extension}`);
  
  try {
    console.log("📂 Reading local file:", file.path);
    const fileBuffer = await fs.readFile(file.path);

    console.log("☁️ Uploading to S3:", key);
    await s3.uploadFile({
      key,
      body: fileBuffer,
      contentType: file.mimetype,
      contentLength: file.size,
    });

    const imageUrl = s3.getPublicUrl(key);
    console.log("✅ Image uploaded to S3:", imageUrl);

    // 2. Call OpenRouter with Vision model
    const base64Image = fileBuffer.toString("base64");
    console.log("🤖 Calling OpenRouter with Vision model...");

    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Identify and transcribe all the text in this image. Return only the transcribed text precisely as it appears, preserving the structure if possible. If there is no text, return an empty string. If it's a document, mailbox, or sign, extract the relevant information."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${file.mimetype};base64,${base64Image}`
                  }
                }
              ]
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": SITE_URL,
            "X-Title": SITE_NAME,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      console.log("📄 OpenRouter response received");
      
      if (!response.data.choices || !response.data.choices[0]) {
        throw new Error("Invalid response format from OpenRouter");
      }

      const extractedText = response.data.choices[0].message.content;

      // 3. Save to History (Optional but recommended)
      try {
          console.log("💾 Saving to OcrHistory...");
          await prisma.ocrHistory.create({
            data: {
              userId,
              imageUrl,
              extractedText,
            }
          });
          console.log("✅ Saved to history");
      } catch (dbError) {
          console.error("⚠️ Error saving to history (non-fatal):", dbError);
      }

      return { text: extractedText, imageUrl };

    } catch (visionError: any) {
      const rawMessage = visionError.response?.data?.error?.message || visionError.message;
      console.error("❌ OpenRouter Vision Error:", rawMessage);
      
      let userFriendlyMessage = rawMessage;
      if (rawMessage.includes("Insufficient credits") || rawMessage.includes("Credit balance is too low")) {
        userFriendlyMessage = "fondos insuficientes";
      }
      
      throw new Error(userFriendlyMessage);
    }

  } catch (error: any) {
    console.error("❌ OCR Service Final Error:", error.message);
    throw error;
  } finally {
    // Clean up local file
    try {
      if (file.path) {
        console.log("扫 Cleaning up local file:", file.path);
        await fs.unlink(file.path);
      }
    } catch (e) {
      console.warn("⚠️ Could not delete temp file", e);
    }
  }
};
