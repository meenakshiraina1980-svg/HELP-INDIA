import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit to handle base64 images
app.use(express.json({ limit: "10mb" }));

// Lazy load Gemini Client to prevent crash if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY environment variable is not configured. Running in simulated fallback mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Simulated backup database for mock analysis
const mockTips = [
  "Separate organic waste from recyclables. Dry waste like milk packets, plastic bottles, and paper must be clean and dry.",
  "Consider setting up a home composting bin for fruit peels, vegetable scraps, and tea leaves to create nutrient-rich soil.",
  "E-waste like old batteries, chargers, and gadgets should never go into dry waste. Dispose of them only at certified e-waste hubs.",
  "Plastics labeled 1 (PET) and 2 (HDPE) are highly recyclable. Give them to your local waste collectors (kabadiwala) for recycling.",
  "Help raise awareness in your school or neighborhood by organizing or participating in Sunday morning cleanliness walks (Plog Runs)."
];

// Helper to provide a fallback analysis when API key is missing
function generateFallbackAnalysis(description: string, category: string) {
  const categories = ["Biodegradable", "Recyclable", "Hazardous", "E-Waste", "General Pile"];
  const detectedCategory = category || categories[Math.floor(Math.random() * categories.length)];
  
  let severity = "Medium";
  if (description.toLowerCase().includes("urgent") || description.toLowerCase().includes("overflow") || description.toLowerCase().includes("smell")) {
    severity = "High";
  } else if (description.toLowerCase().includes("small") || description.toLowerCase().includes("little")) {
    severity = "Low";
  }

  const pointsReward = severity === "High" ? 150 : severity === "Medium" ? 100 : 50;
  const tip = mockTips[Math.floor(Math.random() * mockTips.length)];

  return {
    success: true,
    isMock: true,
    detectedCategory,
    severity,
    confidence: 0.85,
    pointsReward,
    summary: description || "Piles of litter observed in public area.",
    educationalTip: tip,
    actionSteps: [
      "Secure the area to prevent children or animals from coming into contact with hazardous items.",
      "Inform the local municipal authority via the Clean India citizen portal.",
      "Coordinate with local Swachh Bharat volunteers to schedule a quick cleanup drive.",
      "Ensure proper segregating bins (Green for Wet, Blue for Dry) are installed nearby."
    ]
  };
}

// API: Analyze reported garbage spot
app.post("/api/gemini/analyze-garbage", async (req, res) => {
  const { image, description, category } = req.body;
  
  try {
    const ai = getGeminiClient();
    if (!ai) {
      // Return high-fidelity mock response if API key is not available
      const fallback = generateFallbackAnalysis(description || "", category || "");
      return res.json(fallback);
    }

    let contents: any[] = [];
    let promptText = `
      You are an expert Swachh Bharat AI inspector. Analyze this garbage spot report.
      User description: "${description || "None provided"}".
      User-suggested category: "${category || "Unspecified"}".
      
      Classify the garbage spot, and provide actionable tips. Respond in strict JSON format matching this schema:
      {
        "detectedCategory": "Biodegradable" | "Recyclable" | "Hazardous" | "E-Waste" | "General Pile",
        "severity": "Low" | "Medium" | "High",
        "confidence": number (between 0.0 and 1.0),
        "pointsReward": number (between 30 and 200 based on severity and cleanup challenge),
        "summary": "Short 1-sentence assessment",
        "educationalTip": "A useful, highly educational cleanliness or recycling tip custom tailored to this type of waste",
        "actionSteps": [string, string, string] (Exactly 3-4 specific steps to safely handle or report this waste)
      }
    `;

    if (image && image.startsWith("data:")) {
      // Handle base64 image
      const commaIndex = image.indexOf(",");
      const mimeType = image.substring(5, commaIndex.split(";")[0].length + 5);
      const base64Data = image.substring(commaIndex + 1);

      contents.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedCategory: {
              type: Type.STRING,
              description: "The primary classified category: Biodegradable, Recyclable, Hazardous, E-Waste, or General Pile."
            },
            severity: {
              type: Type.STRING,
              description: "Urgency and hazard rating: Low, Medium, or High."
            },
            confidence: {
              type: Type.NUMBER,
              description: "AI confidence level between 0 and 1."
            },
            pointsReward: {
              type: Type.INTEGER,
              description: "Points reward value from 30 to 200."
            },
            summary: {
              type: Type.STRING,
              description: "Brief professional summary of the waste pile."
            },
            educationalTip: {
              type: Type.STRING,
              description: "Eco-friendly disposal, upcycling, or Swachh tip."
            },
            actionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 to 4 sequential, actionable community guidelines."
            }
          },
          required: ["detectedCategory", "severity", "confidence", "pointsReward", "summary", "educationalTip", "actionSteps"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(text.trim());
    res.json({
      success: true,
      isMock: false,
      ...result
    });

  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    // Return graceful fallback on any API exception so user never gets blocked
    const fallback = generateFallbackAnalysis(description || "", category || "");
    res.json({
      ...fallback,
      errorMsg: error.message || "Failed to contact Gemini service, used local analysis."
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Swachh Bharat Clean India Mission Server running on port ${PORT}`);
  });
}

startServer();
