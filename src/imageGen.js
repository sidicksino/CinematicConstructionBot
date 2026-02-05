const axios = require('axios');
const { HF_TOKEN } = require('./config');

// 1. PRIMARY: Hugging Face (Flux.1-Schnell) - Proven to work by User
// "Schnell" = Fast. Much more reliable on free tier than "Dev".
const HF_API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

// 2. FALLBACK: Pollinations.ai (Free/Unlimited)
const POLLINATIONS_URL = "https://image.pollinations.ai/prompt";

async function generateImage(prompt, stepIndex) {
    console.log(`Generating image for step ${stepIndex}...`);

    // --- ATTEMPT 1: Hugging Face (Flux Schnell) ---
    try {
        console.log(`[Primary] Generating via HF Flux.1-Schnell...`);
        const response = await axios.post(
            HF_API_URL,
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                    "Accept": "image/png"
                },
                responseType: "arraybuffer", // Important for binary image data
                timeout: 90000 // 90s timeout as per user snippet
            }
        );

        if (response.status === 200) {
            console.log("✅ HF Image generated!");
            return Buffer.from(response.data);
        }
    } catch (error) {
        console.warn(`⚠️ Primary HF failed: ${error.message} - Switching to Fallback...`);
    }

    // --- ATTEMPT 2: Pollinations.ai (Fallback) ---
    try {
        console.log(`[Fallback] Generating via Pollinations.ai (Turbo)...`);
        const encodedPrompt = encodeURIComponent(prompt);
        // Using 'turbo' model for speed in fallback scenario
        const url = `${POLLINATIONS_URL}/${encodedPrompt}?width=1280&height=720&model=turbo&nologo=true`;
        
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 30000
        });

        if (response.status === 200) {
            console.log("✅ Pollinations Image generated!");
            return Buffer.from(response.data);
        }
    } catch (error) {
        console.error(`❌ All image generation attempts failed for step ${stepIndex}`);
        throw error;
    }
}

module.exports = { generateImage };
