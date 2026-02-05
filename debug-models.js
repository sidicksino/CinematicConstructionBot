const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("No API Key found. Check .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  console.log("Fetching available models...");
  try {
      // For some versions of the SDK, listModels is not directly exposed on genAI.
      // But typically it can be accessed or we can try a basic model to see what works.
      // Let's try to just Instantiate a few common ones and print success.
      
      const modelsToTry = ["gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
      
      for (const modelName of modelsToTry) {
          try {
              const model = genAI.getGenerativeModel({ model: modelName });
              const result = await model.generateContent("Hello");
              console.log(`✅ Model '${modelName}' is AVAILABLE and working.`);
          } catch (e) {
              console.log(`❌ Model '${modelName}' failed:`, e);
          }
      }

  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
