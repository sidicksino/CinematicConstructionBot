const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GEMINI_API_KEY } = require("./config");
const { MASTER_PROMPT } = require("./prompts");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function generateConstructionPrompts(structureNumber) {
    // 1. Initialize the chat with the Master Prompt and "start"
    // Ideally, we'd maintain a chat history, but for simplicity in this stateless flow:
    // We will simulate the conversation state to jump straight to EXECUTION MODE.
    
    // Construct a specific prompt to force the LLM into the output we want directly.
    // Instead of playing the roleplay game, we ask it to execute for a specific choice.
    
    const inputPrompt = `${MASTER_PROMPT}

USER: start
SYSTEM: [Enters Selection Mode and lists 10 options]
USER: ${structureNumber}
SYSTEM: [Enters Execution Mode and generates the output]

IMPORTANT: Provide the response in JSON format so I can parse it easily. 
The JSON should have this structure:
{
  "context_confirmation": "string",
  "images": [
    { "step": "Raw Land", "prompt": "string" },
    { "step": "Land Clearing", "prompt": "string" },
    { "step": "Foundation", "prompt": "string" },
    { "step": "Mid-Construction", "prompt": "string" },
    { "step": "Completed Unfurnished", "prompt": "string" },
    { "step": "Completed Activated", "prompt": "string" }
  ],
  "videos": [
    { "step": "1 to 2", "prompt": "string" },
    { "step": "2 to 3", "prompt": "string" },
    { "step": "3 to 4", "prompt": "string" },
    { "step": "4 to 5", "prompt": "string" },
    { "step": "5 to 6", "prompt": "string" }
  ]
}
`;

    // Retry logic for 429 errors
    const MAX_RETRIES = 1; // Reduced to avoid timeouts
    let retryCount = 0;
    
    while (retryCount <= MAX_RETRIES) {
        try {
            const result = await model.generateContent(inputPrompt);
            const response = await result.response;
            const text = response.text();
            
            // Clean up markdown code blocks if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            // Enhanced 429 check
            const isRateLimit = (error.status === 429) || 
                                (error.status === '429') || 
                                (error.message && error.message.includes('429')) || 
                                (error.message && error.message.includes('Quota exceeded'));

            if (isRateLimit && retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Rate limit hit (Status: ${error.status}). Retrying in 65 seconds... (Attempt ${retryCount}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 65000)); // Wait 65 seconds
                continue;
            }
            console.error("Error generating prompts with Gemini:", error);
            // console.log("Raw Response:", text); // 'text' is not defined here
            throw error;
        }
    }
    throw new Error("Max retries exceeded for Gemini API call.");
}

module.exports = { generateConstructionPrompts };
