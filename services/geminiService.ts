import { GoogleGenAI } from "@google/genai";
import { Asset } from "../types";

// Helper to get the API client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export interface MacroAnalysisResult {
  text: string;
  sources: { title: string; uri: string }[];
}

// Fix: Updated return type to include sources from grounding metadata
export const analyzeMacroCycle = async (language: 'en' | 'zh' = 'en'): Promise<MacroAnalysisResult> => {
  const ai = getAiClient();
  const langInstruction = language === 'zh' ? " Output in Simplified Chinese." : "";
  const prompt = `Analyze the current global macroeconomic cycle status as of late 2024/2025. Is it expansion, peak, contraction, or trough? Look for recent GDP, inflation (CPI), and interest rate trends from major economies (US, EU, China). Keep it concise, under 200 words, focused on investment implications.${langInstruction}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Fix: Extracting sources from groundingMetadata as required by guidelines
    const sources: { title: string; uri: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Source",
            uri: chunk.web.uri || ""
          });
        }
      }
    }

    return {
      text: response.text || "Unable to retrieve macro analysis.",
      sources
    };
  } catch (error) {
    console.warn("Gemini Macro Search Error, retrying without search tool:", error);
    
    // Fallback: Try without the search tool if the first attempt fails (e.g. 500 RPC error)
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      return {
        text: fallbackResponse.text || "Analysis available (Offline Mode).",
        sources: []
      };
    } catch (fallbackError) {
      console.error("Gemini Macro Fallback Error:", fallbackError);
      return { text: "Error connecting to the Oracle. Please check your network or API Key.", sources: [] };
    }
  }
};

export const getStrategicAdvice = async (assets: Asset[], macroContext: string, language: 'en' | 'zh' = 'en'): Promise<string> => {
  const ai = getAiClient();
  const langInstruction = language === 'zh' ? "Output the response in Simplified Chinese." : "";

  const portfolioSummary = assets.map(a => `${a.name} (${a.type} - ${a.region}): $${a.value}`).join(', ');

  const prompt = `
    You are a high-level strategic wealth advisor in a gamified asset management interface.
    
    Current Macro Context:
    ${macroContext}

    My Current "Inventory" (Portfolio):
    ${portfolioSummary}

    Task:
    Provide a strategic "Quest Log" for the user. 
    1. Identify one major opportunity based on the macro context.
    2. Identify one major risk in the current inventory.
    3. Suggest a specific move (e.g., "Rotate from X to Y").
    
    Format as valid HTML using simple tags (<b>, <ul>, <li>, <p>) for direct rendering. Do not use Markdown code blocks.
    Keep the tone like a Sci-Fi Strategy Game Commander briefing.
    ${langInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "The Oracle is silent.";
  } catch (error) {
    console.error("Gemini Strategy Error:", error);
    return "Strategy computation failed.";
  }
};