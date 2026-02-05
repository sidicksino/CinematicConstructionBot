const axios = require('axios');
const { HF_TOKEN } = require('./config');
const fs = require('fs');
const path = require('path');

// specific model - Flux is great for photorealism
const MODEL_ID = "black-forest-labs/FLUX.1-dev"; 
const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

async function generateImage(prompt, stepIndex) {
    console.log(`Generating image for step ${stepIndex}...`);
    try {
        const response = await axios.post(
            API_URL,
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                responseType: "arraybuffer", // Important for binary image data
            }
        );

        if (response.status === 200) {
            return Buffer.from(response.data);
        } else {
             throw new Error(`HF API Error: ${response.status}`);
        }
    } catch (error) {
        console.error("Error generating image:", error.message);
        // Fallback or retry logic could go here
        throw error;
    }
}

module.exports = { generateImage };
