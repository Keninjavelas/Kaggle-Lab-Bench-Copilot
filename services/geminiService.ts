import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Role: You are "Culture", an intelligent, shapeshifting microbial mascot living in the user's phone to help them do better science.

Dynamic Persona:
1. DETECT the organism or context the user is studying based on their protocol or image.
2. ADAPT your personality and tone:
   - **Bacteria (e.g., E. coli)**: Hyperactive, fast-talking, loves 'food' (media), divides frequently. (e.g., "Omg food! Let's grow! Double time!")
   - **Yeast/Fungi**: Chill, bubbly, relaxed, uses baking/fermentation metaphors. (e.g., "Let it rise, friend. Good vibes only.")
   - **Virus/Phage**: Geometric, precise, robotic, 'hacker' vibe, purely logical. (e.g., "TARGET ACQUIRED. INJECTION SEQUENCE INITIATED.")
   - **General/Unknown**: A friendly, encouraging blob of slime.

Task:
1. **Introduction**: Introduce yourself in character based on the detected organism.
2. **Visual Analysis**: Analyze the image. What do you see? (Use metaphors matching your persona).
3. **The Diagnosis**: Diagnose the root cause using deductive reasoning. Explain the science simply (ELI5).
4. **The Fix**: Provide a specific plan to fix it.
5. **Protocol Update**: You MUST provide the FULL CORRECTED PROTOCOL inside a code block with the language identifier "corrected_protocol".

Format: Use Markdown.
CRITICAL: The corrected protocol block is mandatory for the app to function.
Example:
\`\`\`corrected_protocol
Experiment: ...
1. ...
\`\`\`
`;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash";

export const analyzeExperiment = async (
  protocol: string,
  imageBase64: string,
  mimeType: string
): Promise<string> => {
  try {
    const prompt = `Mascot, look at this image. I followed the protocol below exactly, but it failed.
    
    PROTOCOL:
    ${protocol}
    
    1. **Visual Analysis:** What exactly are you seeing in the lane?
    2. **The Diagnosis:** Why did this fail?
    3. **The Fix:** How do I fix it? Provide the corrected protocol block.`;

    const response = await ai.models.generateContent({
      model: modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    return response.text || "Mascot is currently dormant. Please try again.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze the experiment. Ensure your API key is valid.");
  }
};

export const extractTimers = async (protocol: string): Promise<any[]> => {
  try {
    const prompt = `Scan the following laboratory protocol. Identify every step that involves a specific duration (e.g., 'incubate for 30 mins', 'spin for 60 seconds', 'wait 1 hour').
    
    PROTOCOL:
    ${protocol}
    
    Return a JSON list of these timers.
    Format: [{"label": "Step Name/Action", "durationSeconds": number}]
    Do not include markdown formatting, just raw JSON.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Timer Extraction Error:", error);
    return [];
  }
};

export const structureLog = async (transcript: string): Promise<any> => {
  try {
    const prompt = `You are a Lab Scribe. Convert this spoken scientist's note into a structured JSON log entry.
    
    TRANSCRIPT: "${transcript}"
    
    Return JSON: { "action": string, "planned": string, "actual": string, "observation": string }
    If a field is not mentioned, use "N/A" or infer from context.
    Do not include markdown formatting.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Log Structuring Error:", error);
    return { action: "Log Error", planned: "-", actual: "-", observation: transcript };
  }
};

export const checkReagent = async (protocol: string, imageBase64: string, mimeType: string): Promise<any> => {
  try {
    const prompt = `Role: Lab Safety Officer.
    Task: Look at the reagent bottle in the image. Read the label (Name, Concentration, Expiry).
    Compare it against the PROTOCOL provided below.
    
    PROTOCOL:
    ${protocol}
    
    Is this the correct reagent? Is it expired? Is the concentration correct?
    
    Return JSON: { 
      "safe": boolean, 
      "message": "Short explanation (e.g. 'Safe! Pour away.' or 'STOP! Wrong concentration.')", 
      "bottleName": "Detected Name",
      "expiryDate": "Detected Expiry (or 'N/A')",
      "concentration": "Detected Concentration (or 'N/A')"
    }
    Do not include markdown formatting.`;

    const response = await ai.models.generateContent({
      model: modelId,
      config: { responseMimeType: "application/json" },
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: mimeType } },
          { text: prompt }
        ]
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Reagent Check Error:", error);
    return { safe: false, message: "Could not read bottle label." };
  }
}

export const parsePdfToProtocol = async (pdfBase64: string): Promise<string> => {
  try {
    const prompt = `You are a "Paper-to-Pipeline" converter.
    Extract the "Materials and Methods" section from this PDF and convert it into a numbered Step-by-Step Protocol.
    
    Rules:
    1. Ignore Abstract, Introduction, and Discussion.
    2. Focus purely on the recipe/steps.
    3. Format it clearly (e.g., "1. Mix X and Y...", "2. Incubate at...").
    4. If reagents or concentrations are mentioned, include them.
    5. Return ONLY the plain text protocol. Do not add conversational text.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { data: pdfBase64, mimeType: "application/pdf" } },
          { text: prompt }
        ]
      }
    });

    return response.text || "Could not extract protocol from PDF.";
  } catch (error) {
    console.error("PDF Parse Error:", error);
    return "Error parsing PDF. Please copy text manually.";
  }
};

export const roastProtocol = async (protocol: string): Promise<any> => {
  try {
    const prompt = `Role: You are "Reviewer #2", the notoriously grumpy and critical academic peer reviewer.
    Task: Roast this experimental protocol. Find flaws in the experimental design (sample size, controls, logic, timing).
    
    PROTOCOL:
    ${protocol}
    
    Output JSON:
    {
      "verdict": "A short, harsh summary headline (e.g., 'Reject: n=1 is not science').",
      "critique": "A sarcastic but scientifically valid explanation of what is wrong.",
      "score": number (1-10, where 1 is trash and 10 is publishable)
    }
    Do not include markdown formatting.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Roast Error:", error);
    return { verdict: "System Error", critique: "I couldn't read your protocol, which is probably for the best.", score: 0 };
  }
};

export const estimateCost = async (protocol: string): Promise<any> => {
  try {
    const prompt = `Role: Lab Manager / Accountant.
    Task: Estimate the cost of reagents for one run of this protocol based on standard scientific pricing (e.g., Taq polymerase, antibodies, specialized kits are expensive; salt water is cheap).
    
    PROTOCOL:
    ${protocol}
    
    Output JSON:
    {
      "totalCost": "Estimated total string (e.g. '$45.50')",
      "currency": "USD",
      "riskySteps": [
         { "stepIndex": number (1-based index of step), "reagent": "Name", "cost": "High/Medium", "reason": "Why is this step a 'money burn' risk? (e.g. 'Gold-Taq is $2/unit')" }
      ]
    }
    Include only the top 1-2 most expensive steps in riskySteps.
    Do not include markdown formatting.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Cost Est Error:", error);
    return { totalCost: "N/A", currency: "USD", riskySteps: [] };
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
};