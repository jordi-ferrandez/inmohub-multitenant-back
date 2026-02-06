import { prisma } from "@core/lib";
import { S3StorageService } from "@core/services";
import { prependS3EnvPrefix } from "@core/utils";
import { randomUUID } from "crypto";
import path from "path";
import { promises as fs } from "fs";
import axios from "axios";
import { createWorker } from "tesseract.js";

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

    // 2. Call Tesseract.js
    console.log("🤖 Calling Tesseract.js...");

    try {
      const worker = await createWorker(['spa', 'eng']);
      const { data: { text } } = await worker.recognize(file.path);
      await worker.terminate();

      console.log("📄 Tesseract text extracted");
      
      const extractedText = text;

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
      console.error("❌ Tesseract Error:", visionError.message);
      throw new Error("Error extracting text using Tesseract: " + visionError.message);
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
