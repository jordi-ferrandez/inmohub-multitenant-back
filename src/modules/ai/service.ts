export interface AiContext {
  route: string;
  visibleData?: any;
  screenTitle?: string;
  // Add more context fields as needed
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
const SITE_NAME = "InmoHub";

export const chatWithAi = async (messages: ChatMessage[], context: AiContext) => {
  if (!OPENROUTER_API_KEY) {
    console.warn("OPENROUTER_API_KEY is not set. AI features may not work.");
    // For development without key, we might want to throw or return a mock
    // throw new Error("OpenRouter API Key missing");
  }

  const systemPrompt = `
You are a helpful AI assistant for the InmoHub CRM.
Current Context:
Route: ${context.route}
Screen Title: ${context.screenTitle || "Unknown"}
Visible Data: ${JSON.stringify(context.visibleData || {}, null, 2)}

Use this context to answer the user's questions. 
If the user asks about something visible on the screen, refer to the data provided.
If the data is not sufficient, ask for clarification.
`;

  const finalMessages = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "model": "mistralai/mistral-7b-instruct:free", // Free model as requested
        "messages": finalMessages,
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};
